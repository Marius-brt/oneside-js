'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.normalize = exports.print = void 0;
const ansi_colors_1 = __importDefault(require('ansi-colors'));
function print(type, message, fatal) {
  switch (type) {
    case 'log':
      console.log(ansi_colors_1.default.green(`> ${message}`));
      break;
    case 'gray':
      console.log(ansi_colors_1.default.gray(`> ${message}`));
      break;
    case 'success':
      console.log(ansi_colors_1.default.green(`[SUCCESS] ${message}`));
      break;
    case 'info':
      console.log(ansi_colors_1.default.blue(`[INFO] ${message}`));
      break;
    case 'failed':
      console.log(ansi_colors_1.default.red(`[FAILED] ${message}`));
      if (fatal) process.exit(1);
      break;
    case 'error':
      console.log(ansi_colors_1.default.red(`[ERROR] ${message}`));
      if (fatal) process.exit(1);
      break;
  }
}
exports.print = print;
function normalize(path) {
  path = path.replace(/\\/g, '/');
  while (path.length > 0 && ['.', '/'].includes(path[0])) {
    path = path.substring(1);
  }
  return '/' + path;
}
exports.normalize = normalize;
