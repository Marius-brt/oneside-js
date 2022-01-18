import express from 'express';
import merge from 'deepmerge';
import chalk from 'chalk';
import portfinder from 'portfinder';
import favicon from 'serve-favicon';
import cheerio from 'cheerio';
import { existsSync, readFileSync, mkdirSync, mkdir, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { emptyDirSync } from 'fs-extra';
import glob from 'tiny-glob';
import { minify } from 'html-minifier';
import chokidar from 'chokidar';
import http from 'http';
import socketIo from 'socket.io';
import lineReader from 'line-reader';
import progress from 'cli-progress';
import colors from 'ansi-colors';
import dns from 'dns';
import open from 'open';

import { Settings } from './settings';
import { resolve } from 'path';

export class Server {
  private app: express.Express;
  private settings: Settings = {
    ignores: [],
    port: 4050,
    address: 'localhost',
    favicon: '',
    baseFile: 'index.ejs',
    showCompiling: false,
    useLocalIp: false,
    ejsCache: true,
    publicPaths: [],
    printPublicUri: true,
    paths: {
      views: './views',
      public: './public',
      components: './components',
    },
  };
  private server: http.Server;
  private io?: socketIo.Server;
  private dev: boolean = process.argv.length > 2 && process.argv[2].toLowerCase() === 'dev';
  constructor(app: express.Express, settings: Partial<Settings>) {
    this.app = app;
    this.settings = merge(this.settings, settings);
    if (this.settings.baseFile === '' || !existsSync(join(process.cwd(), this.settings.baseFile))) {
      console.log(chalk.red(`!> Base file ${this.settings.baseFile} not found !\n`));
      process.exit(1);
    }
    if (this.settings.favicon !== '') app.use(favicon(resolve(this.settings.favicon)));
    if (this.settings.paths.public !== '')
      app.use(normalize(this.settings.paths.public), express.static(resolve(this.settings.paths.public)));
    this.server = new http.Server(app);
    if (this.dev) {
      this.io = require('socket.io')(this.server);
      console.log(chalk.green(`> Dev mode activated`));
    }
    this.settings.publicPaths.forEach((pblPath) => {
      if (typeof pblPath === 'string') {
        const route = resolve(pblPath).replace(process.cwd(), '');
        app.use(normalize(route), express.static(resolve(pblPath)));
      } else {
        app.use(pblPath.path, express.static(resolve(pblPath.path)));
      }
    });
  }
  set(name: string, value: string) {
    this.app.set(name, value);
  }
  use(...handlers: any[]): void {
    if (handlers.length >= 2 && typeof handlers[0] === 'string' && typeof handlers[1] === 'function')
      this.app.use(handlers[0], handlers[1]);
    else this.app.use(handlers);
  }
  all(path: string, ...handlers: any[]) {
    this.app.all(path, handlers);
  }
  get(path: string, ...handlers: any[]) {
    this.app.get(path, handlers);
  }
  post(path: string, ...handlers: any[]) {
    this.app.post(path, handlers);
  }
  put(path: string, ...handlers: any[]) {
    this.app.put(path, handlers);
  }
  delete(path: string, ...handlers: any[]) {
    this.app.delete(path, handlers);
  }
  patch(path: string, ...handlers: any[]) {
    this.app.patch(path, handlers);
  }
  options(path: string, ...handlers: any[]) {
    this.app.options(path, handlers);
  }
  head(path: string, ...handlers: any[]) {
    this.app.head(path, handlers);
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
            if (err) {
              console.log(chalk.red('- All ports seem to be busy !', err));
              process.exit(1);
            }
            if (port !== this.settings.port)
              console.error(chalk.yellow(`> Port ${this.settings.port} is already in use`));
            dns.lookup(require('os').hostname(), (dnsErr, add) => {
              if (dnsErr && this.settings.useLocalIp) {
                console.log(chalk.red('- Unable to retrieve local IP address !\n', dnsErr));
                process.exit(1);
              }
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
                  this.settings.ignores.push(/(^|[\/\\])\../);
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
                        path === join(process.cwd(), this.settings.baseFile)
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
                this.server.listen(port, this.settings.useLocalIp ? add : this.settings.address, () => {
                  console.log(
                    chalk.green(
                      `> Server OneSide started on http://${
                        this.settings.useLocalIp ? add : this.settings.address
                      }:${port} !`,
                    ),
                  );
                  if (this.settings.printPublicUri)
                    console.log(
                      chalk.gray(
                        `[Info] Public folder Url: http://${
                          this.settings.useLocalIp ? add : this.settings.address
                        }:${port}${normalize(this.settings.paths.public)}`,
                      ),
                    );
                  if (process.argv[3] === 'first') {
                    open(`http://${this.settings.useLocalIp ? add : this.settings.address}:${port}`);
                  } else {
                    this.io?.sockets.emit('reload_live');
                  }
                  if (callback) callback();
                });
              } else {
                this.server.listen(port, this.settings.useLocalIp ? add : this.settings.address, () => {
                  console.log(
                    chalk.green(
                      `> Server OneSide started on http://${
                        this.settings.useLocalIp ? add : this.settings.address
                      }:${port} !`,
                    ),
                  );
                  if (this.settings.printPublicUri)
                    console.log(
                      chalk.gray(
                        `[Info] Public folder Url: http://${
                          this.settings.useLocalIp ? add : this.settings.address
                        }:${port}${normalize(this.settings.paths.public)}`,
                      ),
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

function getBaseHtml(baseFile: string): string {
  const baseHtml = readFileSync(join(process.cwd(), baseFile), { encoding: 'utf-8' });
  if (baseHtml === '') {
    console.log(chalk.red('!> Base file is empty !\n'));
    process.exit(1);
  }
  const miss = [];
  if (!baseHtml.includes('<body')) miss.push('body tag');
  if (!baseHtml.includes('<head')) miss.push('head tag');
  if (miss.length > 0) {
    console.log(chalk.red(`!> Missing ${miss.join(' and ')} in base file !\n`));
    process.exit(1);
  }
  return baseHtml;
}

function normalize(path: string): string {
  path = path.replace(/\\/g, '/');
  while (path.length > 0 && ['.', '/'].includes(path[0])) {
    path = path.substring(1);
  }
  return '/' + path;
}

function compile(pages: string, baseHtml: string, showCompiling: boolean, dev: boolean, callback?: () => void) {
  const path = resolve('./compiled');
  const bar = showCompiling
    ? new progress.SingleBar({
        format: colors.blue('> Compiling {value}/{total} pages in {duration}s'),
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
        const splt = el.split('\\');
        splt.shift();
        const pth = './compiled/' + splt.join('/');
        mkdir(dirname(pth), { recursive: true }, (err) => {
          if (err) {
            console.log(chalk.red('!> Failed to compile ! \n', err));
            process.exit(1);
          }
          const $ = cheerio.load(baseHtml);
          const splt2 = el.split('\\');
          splt2.shift();
          const pth2 = pages + '/' + splt2.join('/');
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
                if (pageHtml.includes('<body') || pageHtml.includes('<head')) {
                  console.log(chalk.red(`!> Failed to compile ! Page ${el} contain body or head tag.`));
                  process.exit(1);
                }
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
                if (htmlSplt.length > 1) $('body').append(htmlSplt[1]);
              }
              if (dev) {
                if (!baseHtml.includes('socket.io/socket.io.js')) {
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
                pth,
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
      console.log(chalk.red('!> Failed to compile ! \n', err));
      process.exit(1);
    });
}

function splitOnce(s: string, on: string): string[] {
  const el = s.split(on);
  if (el.length > 1) return [el.shift() || '', on + el.join(on)];
  else return [el[0]];
}

function unescapeHTML(escapedHTML: string) {
  return escapedHTML.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

function isEmptyOrSpaces(str: string): boolean {
  return str === null || str.match(/^ *$/) !== null;
}
