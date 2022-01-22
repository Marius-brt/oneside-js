'use strict';
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __asyncValues =
  (this && this.__asyncValues) ||
  function (o) {
    if (!Symbol.asyncIterator) throw new TypeError('Symbol.asyncIterator is not defined.');
    var m = o[Symbol.asyncIterator],
      i;
    return m
      ? m.call(o)
      : ((o = typeof __values === 'function' ? __values(o) : o[Symbol.iterator]()),
        (i = {}),
        verb('next'),
        verb('throw'),
        verb('return'),
        (i[Symbol.asyncIterator] = function () {
          return this;
        }),
        i);
    function verb(n) {
      i[n] =
        o[n] &&
        function (v) {
          return new Promise(function (resolve, reject) {
            (v = o[n](v)), settle(resolve, reject, v.done, v.value);
          });
        };
    }
    function settle(resolve, reject, d, v) {
      Promise.resolve(v).then(function (v) {
        resolve({ value: v, done: d });
      }, reject);
    }
  };
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.Application = void 0;
const http_1 = require('http');
const deepmerge_1 = __importDefault(require('deepmerge'));
const fs_1 = require('fs');
const path_1 = require('path');
const cli_progress_1 = __importDefault(require('cli-progress'));
const fs_extra_1 = require('fs-extra');
const ansi_colors_1 = __importDefault(require('ansi-colors'));
const tiny_glob_1 = __importDefault(require('tiny-glob'));
const cheerio_1 = __importDefault(require('cheerio'));
const line_reader_1 = __importDefault(require('line-reader'));
const html_minifier_1 = require('html-minifier');
const socket_io_1 = __importDefault(require('socket.io'));
const portfinder_1 = __importDefault(require('portfinder'));
const dns_1 = __importDefault(require('dns'));
const open_1 = __importDefault(require('open'));
const chokidar_1 = __importDefault(require('chokidar'));
const os_1 = require('os');
const mime_types_1 = __importDefault(require('mime-types'));
const url_1 = __importDefault(require('url'));
const router_1 = require('./router');
const utils_1 = require('./utils');
const response_1 = require('./response');
const next_1 = require('./next');
class Application extends router_1.Router {
  constructor(settings) {
    super();
    this.middlewares = [];
    this.settings = {
      port: 5000,
      address: 'localhost',
      showCompiling: true,
      global: {},
      baseFile: 'index.ejs',
      useLocalIp: false,
      favicon: '',
      ignores: [],
      publicPaths: [],
      printPublicUri: true,
      parseCookies: true,
      parserBody: true,
      paths: {
        views: './views',
        public: './public',
        components: './components',
      },
    };
    this.dev = process.argv.length > 2 && process.argv[2].toLowerCase() === 'dev';
    this.settings = (0, deepmerge_1.default)(this.settings, settings);
    if (this.settings.baseFile === '' || !(0, fs_1.existsSync)((0, path_1.join)(process.cwd(), this.settings.baseFile)))
      (0, utils_1.print)('error', `Base file ${this.settings.baseFile} not found !`, true);
    if (this.settings.favicon !== '') this.public((0, path_1.resolve)(this.settings.favicon));
    if (this.settings.paths.public !== '') this.public(this.settings.paths.public);
    this.settings.publicPaths.forEach((pblPath) => {
      this.public(pblPath);
    });
    this.server = (0, http_1.createServer)((req, res) => {
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
                  'Content-Type': mime_types_1.default.contentType((0, path_1.basename)(endpoint.path)).toString(),
                });
                const buffer = (0, fs_1.createReadStream)((0, path_1.join)(process.cwd(), endpoint.path));
                buffer.on('open', () => buffer.pipe(res));
              } else {
                const data = [];
                let body;
                req
                  .on('data', (chunk) => {
                    data.push(chunk);
                  })
                  .on('end', () => {
                    body = Buffer.concat(data).toString();
                    const request = {
                      params,
                      ip: req.socket.remoteAddress || '',
                      url: req.url || '',
                      endpoint: reqEndpoint,
                      hostname: req.headers.host || '',
                      method,
                      queries: url_1.default.parse(req.url || '', true).query,
                      body: this.settings.parserBody ? parseBody(body) : null,
                      cookies: this.settings.parseCookies ? parseCookies(req.headers.cookie || '') : {},
                    };
                    const response = new response_1.Response(res, {
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
                        const next = new next_1.Next(request, response, endpoint.middlewares);
                        endpoint.middlewares[0](request, response, next);
                      }
                    } else {
                      const middlewares = this.middlewares.concat(endpoint.middlewares);
                      const next = new next_1.Next(request, response, middlewares);
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
      this.io = new socket_io_1.default.Server(this.server);
      (0, utils_1.print)('info', 'Dev mode activated');
    }
  }
  use(...args) {
    if (typeof args[0] === 'string') {
      if (args[1] !== undefined)
        if (args[1] instanceof router_1.Router) {
          for (const [key, value] of Object.entries(args[1].endpoints)) {
            if (!this.endpoints[key]) this.endpoints[key] = [];
            this.endpoints[key].push(...value);
          }
        } else this.middlewares.push(args[1]);
      else (0, utils_1.print)('error', 'Middleware or Router undefined !', true);
    } else {
      if (args[0] instanceof router_1.Router) {
        for (const [key, value] of Object.entries(args[0].endpoints)) {
          if (!this.endpoints[key]) this.endpoints[key] = [];
          this.endpoints[key].push(...value);
        }
      } else this.middlewares.push(args[0]);
    }
  }
  listen(callback) {
    compile(
      this.settings.paths.views,
      getBaseHtml(this.settings.baseFile),
      this.settings.showCompiling,
      this.dev,
      () => {
        portfinder_1.default.getPort(
          {
            port: this.settings.port,
          },
          (err, port) => {
            if (err) (0, utils_1.print)('error', 'All ports seem to be busy !', true);
            if (port !== this.settings.port) (0, utils_1.print)('info', `Port ${this.settings.port} is already in use`);
            dns_1.default.lookup((0, os_1.hostname)(), (dnsErr, add) => {
              if (dnsErr && this.settings.useLocalIp)
                (0, utils_1.print)('error', `Unable to retrieve local IP address !\n${dnsErr}`, true);
              if (this.settings.useLocalIp) this.settings.address = add;
              if (this.dev) {
                if (this.io) {
                  this.io.on('connection', (socket) => {
                    socket.emit('connected_live');
                  });
                  this.settings.ignores.push('./node_modules');
                  this.settings.ignores.push('./compiled');
                  this.settings.ignores.forEach((pth, i) => {
                    if (typeof pth === 'string') this.settings.ignores[i] = (0, path_1.resolve)(pth);
                  });
                  this.settings.ignores.push(/(^|[\\])\../);
                  chokidar_1.default
                    .watch(process.cwd(), {
                      ignoreInitial: true,
                      ignored: this.settings.ignores,
                      persistent: true,
                    })
                    .on('all', (event, path) => {
                      if (
                        path.includes((0, path_1.resolve)(this.settings.paths.public)) ||
                        path.includes((0, path_1.resolve)(this.settings.paths.views)) ||
                        path.includes((0, path_1.resolve)(this.settings.paths.components)) ||
                        path === (0, path_1.join)(process.cwd(), this.settings.baseFile)
                      ) {
                        compile(
                          this.settings.paths.views,
                          getBaseHtml(this.settings.baseFile),
                          this.settings.showCompiling,
                          true,
                          () => {
                            var _a;
                            (_a = this.io) === null || _a === void 0 ? void 0 : _a.sockets.emit('reload_live');
                          },
                        );
                      } else {
                        if (process.send) process.send('restart');
                      }
                    });
                }
                this.server.listen(port, this.settings.address, () => {
                  var _a;
                  (0, utils_1.print)('log', `Server OneSide started on http://${this.settings.address}:${port} !`);
                  if (this.settings.printPublicUri)
                    (0, utils_1.print)(
                      'gray',
                      `Public folder Url: http://${this.settings.address}:${port}${(0, utils_1.normalize)(
                        this.settings.paths.public,
                      )}`,
                    );
                  if (process.argv[3] === 'first') {
                    (0, open_1.default)(`http://${this.settings.address}:${port}`);
                  } else {
                    (_a = this.io) === null || _a === void 0 ? void 0 : _a.sockets.emit('reload_live');
                  }
                  if (callback) callback();
                });
              } else {
                this.server.listen(port, this.settings.address, () => {
                  (0, utils_1.print)('log', `Server OneSide started on http://${this.settings.address}:${port} !`);
                  if (this.settings.printPublicUri)
                    (0, utils_1.print)(
                      'gray',
                      `Public folder Url: http://${this.settings.address}:${port}${(0, utils_1.normalize)(
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
exports.Application = Application;
function parseCookies(cookieHeader) {
  const list = {};
  if (!cookieHeader) return list;
  cookieHeader.split(`;`).forEach((cookie) => {
    const [name, ...rest] = cookie.split(`=`);
    const nm = name === null || name === void 0 ? void 0 : name.trim();
    if (!nm) return;
    const value = rest.join(`=`).trim();
    if (!value) return;
    list[nm] = decodeURIComponent(value);
  });
  return list;
}
function parseBody(body) {
  try {
    if (body === '') return body;
    return JSON.parse(body);
  } catch (e) {
    return body;
  }
}
function getBaseHtml(baseFile) {
  const baseHtml = (0, fs_1.readFileSync)((0, path_1.join)(process.cwd(), baseFile), { encoding: 'utf-8' });
  if (baseHtml === '') (0, utils_1.print)('error', 'Base file is empty !', true);
  const miss = [];
  if (!baseHtml.includes('<body')) miss.push('body tag');
  if (!baseHtml.includes('<head')) miss.push('head tag');
  if (miss.length > 0) (0, utils_1.print)('error', `Missing ${miss.join(' and ')} in base file !`, true);
  return baseHtml;
}
function urlMatch(reqUrl, routeUrl) {
  if (reqUrl == routeUrl) return {};
  const reqSplt = reqUrl.replace(/\/$/, '').split('/');
  const routeSplt = routeUrl.replace(/\/$/, '').split('/');
  if (reqSplt.length != routeSplt.length) return null;
  const params = {};
  for (let i = 0; i < routeSplt.length; i++) {
    if (routeSplt[i].startsWith(':')) params[routeSplt[i].replace(':', '')] = reqSplt[i];
    else if (routeSplt[i] != reqSplt[i]) return null;
  }
  return params;
}
function compile(pages, baseHtml, showCompiling, dev, callback) {
  const path = (0, path_1.resolve)('./compiled');
  const bar = showCompiling
    ? new cli_progress_1.default.SingleBar({
        format: ansi_colors_1.default.blue('[INFO] Compiling {value}/{total} pages in {duration}s'),
        hideCursor: true,
      })
    : null;
  if (!(0, fs_1.existsSync)(path)) (0, fs_1.mkdirSync)(path);
  else (0, fs_extra_1.emptyDirSync)(path);
  (0, tiny_glob_1.default)(`${pages}/**/*.ejs`)
    .then((views) => {
      var views_1, views_1_1;
      return __awaiter(this, void 0, void 0, function* () {
        var e_1, _a;
        if (bar) bar.start(views.length, 0);
        let pageId = 0;
        try {
          for (views_1 = __asyncValues(views); (views_1_1 = yield views_1.next()), !views_1_1.done; ) {
            const el = views_1_1.value;
            pageId++;
            if (bar) bar.update(pageId);
            const splt = el.split('\\');
            splt.shift();
            const pth = './compiled/' + splt.join('/');
            (0, fs_1.mkdir)((0, path_1.dirname)(pth), { recursive: true }, (err) => {
              if (err) (0, utils_1.print)('error', 'Failed to compile !', true);
              const $ = cheerio_1.default.load(baseHtml);
              const splt2 = el.split('\\');
              splt2.shift();
              const pth2 = pages + '/' + splt2.join('/');
              const lines = [];
              const fileTags = [];
              const tags = ['title', 'description', 'keywords', 'author', 'viewport'];
              line_reader_1.default.eachLine(
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
                () =>
                  __awaiter(this, void 0, void 0, function* () {
                    var e_2, _a, e_3, _b;
                    let pageHtml = lines.join('\n');
                    try {
                      for (
                        var fileTags_1 = __asyncValues(fileTags), fileTags_1_1;
                        (fileTags_1_1 = yield fileTags_1.next()), !fileTags_1_1.done;

                      ) {
                        const tag = fileTags_1_1.value;
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
                    } catch (e_2_1) {
                      e_2 = { error: e_2_1 };
                    } finally {
                      try {
                        if (fileTags_1_1 && !fileTags_1_1.done && (_a = fileTags_1.return)) yield _a.call(fileTags_1);
                      } finally {
                        if (e_2) throw e_2.error;
                      }
                    }
                    if (pageHtml !== '') {
                      if (pageHtml.includes('<body') || pageHtml.includes('<head'))
                        (0, utils_1.print)('error', `Failed to compile ! Page ${el} contain body or head tag.`, true);
                      const $2 = cheerio_1.default.load(pageHtml, null, false);
                      try {
                        for (
                          var _c = __asyncValues(['title', 'meta', 'link', 'style']), _d;
                          (_d = yield _c.next()), !_d.done;

                        ) {
                          const pageTag = _d.value;
                          $2(pageTag).each((i, item) => {
                            const styleHtml = $2.html(item);
                            $2(item).remove();
                            $('head').append(styleHtml);
                          });
                        }
                      } catch (e_3_1) {
                        e_3 = { error: e_3_1 };
                      } finally {
                        try {
                          if (_d && !_d.done && (_b = _c.return)) yield _b.call(_c);
                        } finally {
                          if (e_3) throw e_3.error;
                        }
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
                    (0, fs_1.writeFileSync)(
                      pth,
                      unescapeHTML(
                        (0, html_minifier_1.minify)($.html(), {
                          removeComments: true,
                          collapseWhitespace: true,
                        }),
                      ),
                    );
                  }),
              );
            });
          }
        } catch (e_1_1) {
          e_1 = { error: e_1_1 };
        } finally {
          try {
            if (views_1_1 && !views_1_1.done && (_a = views_1.return)) yield _a.call(views_1);
          } finally {
            if (e_1) throw e_1.error;
          }
        }
        if (bar) bar.stop();
        if (callback) callback();
      });
    })
    .catch((err) => {
      (0, utils_1.print)('failed', `Failed to compile !\n${err}`, true);
    });
}
function isEmptyOrSpaces(str) {
  return str === null || str.match(/^ *$/) !== null;
}
function splitOnce(s, on) {
  const el = s.split(on);
  if (el.length > 1) return [el.shift() || '', on + el.join(on)];
  else return [el[0]];
}
function unescapeHTML(escapedHTML) {
  return escapedHTML.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}
