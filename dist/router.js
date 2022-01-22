'use strict';
var __classPrivateFieldGet =
  (this && this.__classPrivateFieldGet) ||
  function (receiver, state, kind, f) {
    if (kind === 'a' && !f) throw new TypeError('Private accessor was defined without a getter');
    if (typeof state === 'function' ? receiver !== state || !f : !state.has(receiver))
      throw new TypeError('Cannot read private member from an object whose class did not declare it');
    return kind === 'm' ? f : kind === 'a' ? f.call(receiver) : f ? f.value : state.get(receiver);
  };
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
var _Router_instances, _Router_Add;
Object.defineProperty(exports, '__esModule', { value: true });
exports.Router = void 0;
const path_1 = require('path');
const fs_1 = require('fs');
const tiny_glob_1 = __importDefault(require('tiny-glob'));
const utils_1 = require('./utils');
class Router {
  constructor() {
    _Router_instances.add(this);
    this.endpoints = {};
  }
  public(path) {
    if (path.startsWith('/')) path = `.${path}`;
    if ((0, fs_1.existsSync)(path)) {
      if ((0, fs_1.statSync)(path).isFile()) {
        __classPrivateFieldGet(this, _Router_instances, 'm', _Router_Add).call(this, {
          path: `/${(0, path_1.normalize)(path).replace(/\\/g, '/')}`,
          method: 'get',
          middlewares: [],
          static: true,
        });
      } else {
        (0, tiny_glob_1.default)(`${(0, path_1.resolve)(path)}/**/*`)
          .then((files) => {
            files.forEach((file) => {
              __classPrivateFieldGet(this, _Router_instances, 'm', _Router_Add).call(this, {
                path: `/${(0, path_1.normalize)(file).replace(/\\/g, '/')}`,
                method: 'get',
                middlewares: [],
                static: true,
              });
            });
          })
          .catch((err) => {
            (0, utils_1.print)('failed', `Failed to load static files !\n${err}`);
          });
      }
    }
  }
  get(path, ...middlewares) {
    __classPrivateFieldGet(this, _Router_instances, 'm', _Router_Add).call(this, {
      path,
      middlewares,
      method: 'get',
    });
  }
  post(path, ...middlewares) {
    __classPrivateFieldGet(this, _Router_instances, 'm', _Router_Add).call(this, {
      path,
      middlewares,
      method: 'post',
    });
  }
  put(path, ...middlewares) {
    __classPrivateFieldGet(this, _Router_instances, 'm', _Router_Add).call(this, {
      path,
      middlewares,
      method: 'put',
    });
  }
  patch(path, ...middlewares) {
    __classPrivateFieldGet(this, _Router_instances, 'm', _Router_Add).call(this, {
      path,
      middlewares,
      method: 'patch',
    });
  }
  options(path, ...middlewares) {
    __classPrivateFieldGet(this, _Router_instances, 'm', _Router_Add).call(this, {
      path,
      middlewares,
      method: 'options',
    });
  }
  head(path, ...middlewares) {
    __classPrivateFieldGet(this, _Router_instances, 'm', _Router_Add).call(this, {
      path,
      middlewares,
      method: 'head',
    });
  }
  delete(path, ...middlewares) {
    __classPrivateFieldGet(this, _Router_instances, 'm', _Router_Add).call(this, {
      path,
      middlewares,
      method: 'delete',
    });
  }
}
exports.Router = Router;
(_Router_instances = new WeakSet()),
  (_Router_Add = function _Router_Add(route) {
    if (route.middlewares.length > 0 || route.static === true) {
      if (!this.endpoints[route.method]) this.endpoints[route.method] = [];
      else if (this.endpoints[route.method].find((el) => el.path === route.path)) return;
      this.endpoints[route.method].push({
        path: route.path.replace(/ /g, ''),
        middlewares: route.middlewares,
        static: route.static || false,
      });
    }
  });
