import { Response } from 'express';
import ejs from 'ejs';
import { resolve } from 'path';
import chalk from 'chalk';

export class Render {
  private res: Response;
  private settings = {
    status: 200,
    file: '',
    global: {},
    data: {},
    useCache: true,
    dev: false,
  };
  constructor(file: string, res: Response, dev: boolean, useCache: boolean) {
    this.settings.file = file.replace('.ejs', '');
    this.res = res;
    this.settings.dev = dev;
    this.settings.useCache = useCache;
  }
  status(code: number): Render {
    this.settings.status = code;
    return this;
  }
  global(globalData: {}): Render {
    this.settings.global = globalData;
    return this;
  }
  ejs(data: {}): Render {
    this.settings.data = data;
    return this;
  }
  send() {
    ejs.renderFile(
      `${resolve('./compiled')}/${this.settings.file}.ejs`,
      this.settings.data,
      { cache: !this.settings.dev && this.settings.useCache },
      (err, html) => {
        if (err) {
          console.log(chalk.red('!> Failed to render page !\n', err));
          if (this.settings.dev)
            return this.res.status(500)
              .send(`<p>Failed to render page !</p><script src="/socket.io/socket.io.js"></script>
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
          else return this.res.status(500).send('Failed to render page !');
        }
        if (Object.keys(this.settings.global).length > 0)
          html = html.replace('$GLOBAL$', `<script>const global = ${JSON.stringify(this.settings.global)}</script>`);
        else html = html.replace('$GLOBAL$', '');
        this.res.status(this.settings.status).send(html);
      },
    );
  }
}
