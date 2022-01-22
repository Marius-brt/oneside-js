import { createServer, IncomingMessage, Server, ServerResponse } from 'http';
import merge from 'deepmerge';
import { existsSync, mkdirSync, mkdir, writeFileSync, readFileSync, createReadStream } from 'fs';
import { resolve, dirname, join, basename } from 'path';
import progress from 'cli-progress';
import { emptyDirSync } from 'fs-extra';
import colors from 'ansi-colors';
import glob from 'tiny-glob';
import cheerio from 'cheerio';
import lineReader from 'line-reader';
import { minify } from 'html-minifier';
import ioserver from 'socket.io';
import portfinder from 'portfinder';
import dns from 'dns';
import open from 'open';
import chokidar from 'chokidar';
import { hostname } from 'os';
import mime from 'mime-types';
import url from 'url';

import { Router, IMiddleware } from './router';
import { print, normalize } from './utils';
import { Request } from './request';
import { Response } from './response';
import { Next } from './next';

export interface AppSettings {
  port: number;
  address: string;
  global: object;
  baseFile: string;
  favicon: string;
  useLocalIp: boolean;
  showCompiling: boolean;
  ignores: (string | RegExp)[];
  printPublicUri: boolean;
  publicPaths: string[];
  reloadPaths: string[];
  parseCookies: boolean;
  parserBody: boolean;
  paths: {
    public: string;
    components: string;
    views: string;
  };
}

export class Application extends Router {
  private middlewares: IMiddleware[] = [];
  private server: Server;
  private settings: AppSettings = {
    port: 5000,
    address: 'localhost',
    showCompiling: true,
    global: {},
    baseFile: 'index.ejs',
    useLocalIp: false,
    favicon: '',
    ignores: [],
    publicPaths: [],
    reloadPaths: [],
    printPublicUri: true,
    parseCookies: true,
    parserBody: true,
    paths: {
      views: './views',
      public: './public',
      components: './components',
    },
  };
  private io?: ioserver.Server;
  private dev: boolean = process.argv.length > 2 && process.argv[2].toLowerCase() === 'dev';
  constructor(settings: Partial<AppSettings>) {
    super();
    this.settings = merge(this.settings, settings);
    if (this.settings.baseFile === '' || !existsSync(join(process.cwd(), this.settings.baseFile)))
      print('error', `Base file ${this.settings.baseFile} not found !`, true);
    if (this.settings.favicon !== '') this.public(resolve(this.settings.favicon));
    if (this.settings.paths.public !== '') this.public(this.settings.paths.public);
    this.settings.publicPaths.forEach((pblPath) => {
      this.public(pblPath);
    });
    this.server = createServer((req: IncomingMessage, res: ServerResponse) => {
      const method = req.method !== undefined ? req.method.toLocaleLowerCase() : null;
      const reqEndpoint = req.url !== undefined ? req.url.split('?')[0] : null;
      if (method && reqEndpoint) {
        if (this.endpoints[method.toLocaleLowerCase()]) {
          let found = false;
          for (const endpoint of this.endpoints[method.toLocaleLowerCase()]) {
            const params = urlMatch(reqEndpoint, endpoint.path);
            if (params !== null) {
              found = true;
              if (endpoint.static) {
                res.writeHead(200, {
                  'Content-Type': mime.contentType(basename(endpoint.path)).toString(),
                });
                const buffer = createReadStream(join(process.cwd(), endpoint.path));
                buffer.on('open', () => buffer.pipe(res));
              } else {
                const data: Buffer[] = [];
                let body: string;
                req
                  .on('data', (chunk) => {
                    data.push(chunk);
                  })
                  .on('end', () => {
                    body = Buffer.concat(data).toString();
                    const request: Request & { [k: string]: any } = {
                      params,
                      ip: req.socket.remoteAddress || '',
                      url: req.url || '',
                      endpoint: reqEndpoint,
                      hostname: req.headers.host || '',
                      method,
                      queries: url.parse(req.url || '', true).query,
                      body: this.settings.parserBody ? parseBody(body) : null,
                      cookies: this.settings.parseCookies ? parseCookies(req.headers.cookie || '') : {},
                    };
                    const response = new Response(res, {
                      global: this.settings.global,
                      ejs: {},
                      file: '',
                      useCache: false,
                      dev: this.dev,
                    });
                    if (this.middlewares.length === 0) {
                      if (endpoint.middlewares.length === 1) {
                        endpoint.middlewares[0](request, response);
                      } else {
                        const next = new Next(request, response, endpoint.middlewares);
                        endpoint.middlewares[0](request, response, next);
                      }
                    } else {
                      const middlewares = this.middlewares.concat(endpoint.middlewares);
                      const next = new Next(request, response, middlewares);
                      middlewares[0](request, response, next);
                    }
                  });
              }
              break;
            }
          }
          if (!found && !res.writableEnded) {
            res.writeHead(404, {
              'Content-Type': 'plain/text',
            });
            res.end(`Endpoint ${method.toUpperCase()} ${reqEndpoint} not found`);
          }
        } else {
          res.writeHead(404, {
            'Content-Type': 'plain/text',
          });
          res.end(`Endpoint ${method.toUpperCase()} ${reqEndpoint} not found`);
        }
      } else {
        res.end();
      }
    });

    if (this.dev) {
      this.io = new ioserver.Server(this.server);
      print('info', 'Dev mode activated');
    }
  }

  use(...args: [path: string, middleware: IMiddleware | Router] | [middleware: IMiddleware | Router]) {
    if (typeof args[0] === 'string') {
      if (args[1] !== undefined)
        if (args[1] instanceof Router) {
          for (const [key, value] of Object.entries(args[1].endpoints)) {
            if (!this.endpoints[key]) this.endpoints[key] = [];
            this.endpoints[key].push(...value);
          }
        } else this.middlewares.push(args[1]);
      else print('error', 'Middleware or Router undefined !', true);
    } else {
      if (args[0] instanceof Router) {
        for (const [key, value] of Object.entries(args[0].endpoints)) {
          if (!this.endpoints[key]) this.endpoints[key] = [];
          this.endpoints[key].push(...value);
        }
      } else this.middlewares.push(args[0]);
    }
  }

  listen(callback?: () => void) {
    compile(
      this.settings.paths.views,
      getBaseHtml(this.settings.baseFile),
      this.settings.showCompiling,
      this.dev,
      () => {
        portfinder.getPort(
          {
            port: this.settings.port,
          },
          (err, port) => {
            if (err) print('error', 'All ports seem to be busy !', true);
            if (port !== this.settings.port) print('info', `Port ${this.settings.port} is already in use`);
            dns.lookup(hostname(), (dnsErr, add) => {
              if (dnsErr && this.settings.useLocalIp)
                print('error', `Unable to retrieve local IP address !\n${dnsErr}`, true);
              if (this.settings.useLocalIp) this.settings.address = add;
              if (this.dev) {
                if (this.io) {
                  this.io.on('connection', (socket) => {
                    socket.emit('connected_live');
                  });
                  this.settings.ignores.push('./node_modules');
                  this.settings.ignores.push('./compiled');
                  this.settings.ignores.forEach((pth, i) => {
                    if (typeof pth === 'string') this.settings.ignores[i] = resolve(pth);
                  });
                  this.settings.ignores.push(/(^|[\\])\../);
                  chokidar
                    .watch(process.cwd(), {
                      ignoreInitial: true,
                      ignored: this.settings.ignores,
                      persistent: true,
                    })
                    .on('all', (event, path) => {
                      if (
                        path.includes(resolve(this.settings.paths.public)) ||
                        path.includes(resolve(this.settings.paths.views)) ||
                        path.includes(resolve(this.settings.paths.components)) ||
                        path === join(process.cwd(), this.settings.baseFile) ||
                        this.settings.reloadPaths.some((el) => path.includes(resolve(el)))
                      ) {
                        compile(
                          this.settings.paths.views,
                          getBaseHtml(this.settings.baseFile),
                          this.settings.showCompiling,
                          true,
                          () => {
                            this.io?.sockets.emit('reload_live');
                          },
                        );
                      } else {
                        if (process.send) process.send('restart');
                      }
                    });
                }
                this.server.listen(port, this.settings.address, () => {
                  print('log', `Server OneSide started on http://${this.settings.address}:${port} !`);
                  if (this.settings.printPublicUri)
                    print(
                      'gray',
                      `Public folder Url: http://${this.settings.address}:${port}${normalize(
                        this.settings.paths.public,
                      )}`,
                    );
                  if (process.argv[3] === 'first') {
                    open(`http://${this.settings.address}:${port}`);
                  } else {
                    this.io?.sockets.emit('reload_live');
                  }
                  if (callback) callback();
                });
              } else {
                this.server.listen(port, this.settings.address, () => {
                  print('log', `Server OneSide started on http://${this.settings.address}:${port} !`);
                  if (this.settings.printPublicUri)
                    print(
                      'gray',
                      `Public folder Url: http://${this.settings.address}:${port}${normalize(
                        this.settings.paths.public,
                      )}`,
                    );
                  if (callback) callback();
                });
              }
            });
          },
        );
      },
    );
  }
}

function parseCookies(cookieHeader: string) {
  const list: { [k: string]: string } = {};
  if (!cookieHeader) return list;
  cookieHeader.split(`;`).forEach((cookie) => {
    const [name, ...rest] = cookie.split(`=`);
    const nm = name?.trim();
    if (!nm) return;
    const value = rest.join(`=`).trim();
    if (!value) return;
    list[nm] = decodeURIComponent(value);
  });
  return list;
}

function parseBody(body: string) {
  try {
    if (body === '') return body;
    return JSON.parse(body);
  } catch (e) {
    return body;
  }
}

function getBaseHtml(baseFile: string): string {
  const baseHtml = readFileSync(join(process.cwd(), baseFile), { encoding: 'utf-8' });
  if (baseHtml === '') print('error', 'Base file is empty !', true);
  const miss = [];
  if (!baseHtml.includes('<body')) miss.push('body tag');
  if (!baseHtml.includes('<head')) miss.push('head tag');
  if (miss.length > 0) print('error', `Missing ${miss.join(' and ')} in base file !`, true);
  return baseHtml;
}

function urlMatch(reqUrl: string, routeUrl: string): { [k: string]: string } | null {
  if (reqUrl == routeUrl) return {};
  const reqSplt = reqUrl.replace(/\/$/, '').split('/');
  const routeSplt = routeUrl.replace(/\/$/, '').split('/');
  if (reqSplt.length != routeSplt.length) return null;
  const params: { [k: string]: string } = {};
  for (let i = 0; i < routeSplt.length; i++) {
    if (routeSplt[i].startsWith(':')) params[routeSplt[i].replace(':', '')] = reqSplt[i];
    else if (routeSplt[i] != reqSplt[i]) return null;
  }
  return params;
}

function compile(pages: string, baseHtml: string, showCompiling: boolean, dev: boolean, callback?: () => void) {
  const path = resolve('./compiled');
  const bar = showCompiling
    ? new progress.SingleBar({
        format: colors.blue('[INFO] Compiling {value}/{total} pages in {duration}s'),
        hideCursor: true,
      })
    : null;
  if (!existsSync(path)) mkdirSync(path);
  else emptyDirSync(path);
  glob(`${pages}/**/*.ejs`)
    .then(async (views) => {
      if (bar) bar.start(views.length, 0);
      let pageId = 0;
      for await (const el of views) {
        pageId++;
        if (bar) bar.update(pageId);
        const splt = el.replace(/\\/g, '/').split('/');
        splt.shift();
        const pth = './compiled/' + splt.join('/');
        mkdir(dirname(pth), { recursive: true }, (err) => {
          if (err) print('error', 'Failed to compile !', true);
          let $ = cheerio.load(baseHtml);
          const splt2 = el.replace(/\\/g, '/').split('/');
          splt2.shift();
          const pth2 = resolve(join(pages, splt2.join('/')));
          const lines: string[] = [];
          const fileTags: { name: string; value: string }[] = [];
          const tags: string[] = ['title', 'description', 'keywords', 'author', 'viewport'];
          lineReader.eachLine(
            pth2,
            (line) => {
              const lnTag = tags.find((tag) => line.trim().startsWith(`:${tag}:`));
              if (lnTag)
                fileTags.push({
                  name: lnTag,
                  value: line.replace(`:${lnTag}:`, '').trim(),
                });
              else if (!isEmptyOrSpaces(line)) lines.push(line);
            },
            async () => {
              let pageHtml = lines.join('\n');
              for await (const tag of fileTags) {
                switch (tag.name) {
                  case 'title':
                    if ($('title').length > 0) $('title').first().text(tag.value);
                    else $('head').append(`<title>${tag.value}</title>`);
                    break;
                  default:
                    if ($(`meta[name="${tag.name}"]`).length > 0)
                      $(`meta[name="${tag.name}"]`).attr('content', tag.value);
                    else $('head').append(`<meta name="${tag.name}" content="${tag.value}">`);
                    break;
                }
              }
              if (pageHtml !== '') {
                if (pageHtml.includes('<body') || pageHtml.includes('<head'))
                  print('error', `Failed to compile ! Page ${el} contain body or head tag.`, true);
                const $2 = cheerio.load(pageHtml, null, false);
                for await (const pageTag of ['title', 'meta', 'link', 'style']) {
                  $2(pageTag).each((i, item) => {
                    const styleHtml = $2.html(item);
                    $2(item).remove();
                    $('head').append(styleHtml);
                  });
                }
                pageHtml = $2.html();
                const htmlSplt = splitOnce(pageHtml, '<script');
                const body = $('body').children();
                if (baseHtml.includes(':page:')) {
                  $ = cheerio.load($.html().replace(':page:', htmlSplt[0]));
                } else {
                  if (body.length > 0) {
                    let found = false;
                    for (let i = body.length - 1; i >= 0; i--) {
                      if (!found && ($(body[i])[0].name !== 'script' || i === 0)) {
                        found = true;
                        $(body[i]).after(htmlSplt[0] + '$GLOBAL$');
                      }
                    }
                  } else {
                    $('body').prepend(htmlSplt[0] + '$GLOBAL$');
                  }
                }
                if (htmlSplt.length > 1) $('body').append(htmlSplt[1]);
              }
              if (dev) {
                if (!$.html().includes('socket.io/socket.io.js')) {
                  $('body').append(`<script src="/socket.io/socket.io.js"></script>
						  <script>
							const socket = io();
							let live_s_connected = false;
							socket.on('connected_live', () => {
								if(live_s_connected) location.reload()
								live_s_connected = true;
							  console.log("Connected to OneSide Live Server !")
							})
							socket.on('reload_live', () => {
								location.reload()
							})
						  </script>`);
                } else {
                  $('body').append(`<script>
								let live_s_connected = false;
							  socket.on('connected_live', () => {
								  if(live_s_connected) location.reload()
								  live_s_connected = true;
								  console.log("Connected to OneSide Live Server !")
							  })
							socket.on('reload_live', () => {
								location.reload()
							})
						  </script>`);
                }
              }
              writeFileSync(
                resolve(pth),
                unescapeHTML(
                  minify($.html(), {
                    removeComments: true,
                    collapseWhitespace: true,
                  }),
                ),
              );
            },
          );
        });
      }
      if (bar) bar.stop();
      if (callback) callback();
    })
    .catch((err) => {
      print('failed', `Failed to compile !\n${err}`, true);
    });
}

function isEmptyOrSpaces(str: string): boolean {
  return str === null || str.match(/^ *$/) !== null;
}

function splitOnce(s: string, on: string): string[] {
  const el = s.split(on);
  if (el.length > 1) return [el.shift() || '', on + el.join(on)];
  else return [el[0]];
}

function unescapeHTML(escapedHTML: string) {
  return escapedHTML.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}
