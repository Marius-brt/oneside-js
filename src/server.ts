import express, { Response } from 'express';
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
import { spawn } from 'child_process';

import { Settings } from './settings';
import { Render } from './render';
import { resolve } from 'path';

export class Server {
  private app: express.Express;
  private settings: Settings = {
    port: 4050,
    address: 'localhost',
    favicon: '',
    baseFile: 'index.ejs',
    paths: {
      views: './views',
      sources: './src',
      components: './components',
    },
  };
  private server: http.Server;
  private io?: socketIo.Server;
  private dev: boolean = process.argv.length > 2 && process.argv[2].toLowerCase() === 'dev';
  constructor(app: express.Express, settings: Partial<Settings>) {
    this.app = app;
    this.settings = { ...this.settings, ...settings };
    if (this.settings.baseFile === '' || !existsSync(join(process.cwd(), this.settings.baseFile))) {
      console.log(chalk.red('!> Base File not found !\n'));
      process.exit(1);
    }
    const baseHtml = getBaseHtml(this.settings.baseFile);
    if (this.settings.favicon !== '') app.use(favicon(resolve(this.settings.favicon)));
    app.use(normalize(this.settings.paths.sources), express.static(resolve(this.settings.paths.sources)));
    compile(this.settings.paths.views, baseHtml, this.dev);
    this.server = new http.Server(app);
    if (this.dev) this.io = require('socket.io')(this.server);
  }
  set(name: string, value: string) {
    this.app.set(name, value);
  }
  use(...handlers: any[]) {
    this.app.use(handlers);
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
  render(file: string, res: Response): Render {
    return new Render(file, res, this.dev);
  }
  listen(callback?: () => void) {
    portfinder.getPort(
      {
        port: this.settings.port,
      },
      (err, port) => {
        if (err) return console.log(chalk.red('- All ports seem to be busy !', err));
        if (port !== this.settings.port) console.error(chalk.yellow(`> Port ${this.settings.port} is already in use`));
        if (this.dev) {
          console.log(chalk.green(`> Dev mode activated`));
          if (this.io) {
            this.io.on('connection', (socket) => {
              socket.emit('connected_live');
            });
            chokidar
              .watch(process.cwd(), {
                ignoreInitial: true,
                ignored: /(^|[\/\\])\../,
                persistent: true,
              })
              .on('all', (event, path) => {
                if (
                  path.includes(resolve(this.settings.paths.sources)) ||
                  path.includes(resolve(this.settings.paths.views)) ||
                  path.includes(resolve(this.settings.paths.components)) ||
                  path === join(process.cwd(), this.settings.baseFile)
                ) {
                  compile(this.settings.paths.views, getBaseHtml(this.settings.baseFile), true, () => {
                    this.io?.sockets.emit('reload_live');
                  });
                }
              });
          }
          this.server.listen(port, this.settings.address, () => {
            console.log(chalk.green(`> Server OneSide started on http://${this.settings.address}:${port} !`));
            if (callback) callback();
          });
        } else {
          this.server.listen(port, this.settings.address, () => {
            console.log(chalk.green(`> Server OneSide started on http://${this.settings.address}:${port} !`));
            if (callback) callback();
          });
        }
      },
    );
  }
}

function getBaseHtml(baseFile: string): string {
  const baseHtml = readFileSync(join(process.cwd(), baseFile), { encoding: 'utf-8' });
  if (baseHtml === '') {
    console.log(chalk.red('!> Base File is empty !\n'));
    process.exit(1);
  }
  const $ = cheerio.load(baseHtml);
  const miss = [];
  if ($('body').html() === '') miss.push('body tag');
  if ($('head').html() === '') miss.push('head tag');
  if (miss.length > 0) {
    console.log(chalk.red(`!> Missing ${miss.join(' and ')} in Base File !\n`));
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

function compile(pages: string, baseHtml: string, dev: boolean, callback?: () => void) {
  const path = resolve('./compiled');
  if (!existsSync(path)) mkdirSync(path);
  else emptyDirSync(path);
  glob(`${pages}/**/*.ejs`)
    .then(async (views) => {
      for await (const el of views) {
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
          const pageHtml = readFileSync(pth2, { encoding: 'utf-8' });
          if (pageHtml !== '') {
            if (pageHtml.includes('<body') || pageHtml.includes('<body')) {
              console.log(chalk.red(`!> Failed to compile ! Page ${el} contain body or head tag.`));
              process.exit(1);
            }
            const htmlSplt = splitOnce(pageHtml, '<script');
            if (htmlSplt.length > 1) $('body').append(htmlSplt[1]);
            const body = $('body').children();
            let found = false;
            for (let i = body.length - 1; i >= 0; i--) {
              if (!found && ($(body[i])[0].name !== 'script' || i === 0)) {
                found = true;
                $(body[i]).after(htmlSplt[0] + '$GLOBAL$');
              }
            }
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
            pth,
            unescapeHTML(
              minify($.html(), {
                removeComments: true,
                collapseWhitespace: true,
              }),
            ),
          );
        });
      }
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
