export interface Settings {
  /**
   * Port of the application.
   *
   * @type { number }
   * @default 4050
   */
  port: number;
  /**
   * Address of the application.
   *
   * @type { string }
   * @default 'localhost'
   */
  address: string;
  /**
   * Path of the favicon.
   *
   * @type { string }
   * @default ''
   */
  favicon: string;
  /**
   * Path to the base file.
   *
   * @type { string }
   * @default 'index.ejs'
   */
  baseFile: string;
  /**
   * Print compiling progress in the prompt each time it compiles.
   *
   * @type { boolean }
   * @default false
   */
  showCompiling: boolean;
  /**
   * Print public folder Uri in console on startup.
   *
   * @type { boolean }
   * @default true
   */
  printPublicUri: boolean;
  /**
   * Enable Ejs Cache. Ejs Cache is always disabled in Dev mode.
   *
   * @type { boolean }
   * @default true
   */
  ejsCache: boolean;
  /**
   * Use the local ip for the address of the server. If true, the local IP address will be used instead of the address parameter.
   *
   * @type { boolean }
   * @default false
   */
  useLocalIp: boolean;
  /**
   * Files or folders that the Live Server should ignore.
   *
   * @type { (string | RegExp)[] }
   * @default []
   */
  ignores: (string | RegExp)[];
  /**
   * Public folders. By default, the paths.sources is public if is path is not equal to ''.
   *
   * @type { string | { 'route': string; 'path': string } }
   * @default []
   */
  publicPaths: (
    | string
    | {
        route: string;
        path: string;
      }
  )[];
  paths: {
    /**
     * Path of the pages of your Website.
     *
     * @type { string }
     * @default './views'
     */
    views: string;
    /**
     * Path of your project public sources (images, videos, css, js, ...).
     *
     * @type { string }
     * @default './src'
     */
    public: string;
    /**
     * Path of your components.
     *
     * @type { string }
     * @default './components'
     */
    components: string;
  };
}
