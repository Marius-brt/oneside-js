'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.init = exports.router = void 0;
const figlet_1 = __importDefault(require('figlet'));
const ansi_colors_1 = __importDefault(require('ansi-colors'));
const https_1 = require('https');
const fs_1 = require('fs');
const path_1 = require('path');
const server_1 = require('./server');
const utils_1 = require('./utils');
const router_1 = require('./router');
function router() {
  return new router_1.Router();
}
exports.router = router;
function init(settings = {}) {
  console.clear();
  const fonts = ['Ghost', 'Sub-Zero', 'Delta Corps Priest 1', 'Dancing Font', 'DOS Rebel', 'ANSI Regular'];
  console.log(
    ansi_colors_1.default.yellow(
      figlet_1.default.textSync('OneSide', {
        font: fonts[Math.floor(Math.random() * fonts.length)],
      }),
    ),
  );
  (0, https_1.get)('https://registry.npmjs.org/oneside/latest', (resp) => {
    let data = '';
    resp.on('data', (chunk) => {
      data += chunk;
    });
    resp.on('end', () => {
      const version = JSON.parse(
        (0, fs_1.readFileSync)((0, path_1.join)(__dirname, '../package.json'), { encoding: 'utf-8' }),
      ).version;
      const latest = JSON.parse(data).version;
      if (version !== latest)
        (0, utils_1.print)(
          'info',
          `New version of OneSide available ${version} (current) -> ${latest}. Use the "npm i oneside@latest" command to install the latest version available.`,
        );
    });
  });
  return new server_1.Application(settings);
}
exports.init = init;
