'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.Response = void 0;
const deepmerge_1 = __importDefault(require('deepmerge'));
const ejs_1 = __importDefault(require('ejs'));
const path_1 = require('path');
const http_1 = require('http');
const utils_1 = require('./utils');
class Response {
  constructor(res, settings) {
    this.res = res;
    this.settings = settings;
  }
  status(code) {
    this.res.statusCode = code;
    return this;
  }
  global(data) {
    this.settings.global = (0, deepmerge_1.default)(this.settings.global, data);
    return this;
  }
  ejs(data) {
    this.settings.ejs = data;
    return this;
  }
  setHeader(name, value) {
    this.res.setHeader(name, value);
  }
  json(data) {
    if (!this.res.writableEnded) {
      this.res.setHeader('Content-Type', 'application/json');
      this.res.end(JSON.stringify(data));
    }
  }
  send(text) {
    if (!this.res.writableEnded) this.res.end(typeof text === 'object' ? JSON.stringify(text) : text);
  }
  rest(data) {
    const msg = {
      success: this.res.statusCode < 300,
      message: http_1.STATUS_CODES[this.res.statusCode],
      status: this.res.statusCode,
    };
    if (data) {
      if (this.res.statusCode < 300) msg.data = data;
      else msg.error = data;
    }
    this.json(msg);
  }
  render(page) {
    if (!this.res.writableEnded) {
      this.settings.file = page.replace('.ejs', '');
      this.res.setHeader('Content-Type', 'text/html');
      ejs_1.default.renderFile(
        `${(0, path_1.resolve)('./compiled')}/${this.settings.file}.ejs`,
        this.settings.ejs,
        { cache: !this.settings.dev && this.settings.useCache },
        (err, html) => {
          if (err) {
            (0, utils_1.print)('failed', 'Failed to render page !');
            this.res.statusCode = 500;
            if (this.settings.dev)
              return this.res.end(`<p>Failed to render page !</p><script src="/socket.io/socket.io.js"></script>
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
            else return this.res.end('<p>Failed to render page !</p>');
          }
          if (Object.keys(this.settings.global).length > 0)
            html = html.replace('$GLOBAL$', `<script>const global = ${JSON.stringify(this.settings.global)}</script>`);
          else html = html.replace('$GLOBAL$', '');
          this.res.end(html);
        },
      );
    }
  }
  isSended() {
    return this.res.writableEnded;
  }
}
exports.Response = Response;
