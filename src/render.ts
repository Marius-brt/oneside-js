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
    title: '',
  };
  private dev: boolean;
  constructor(file: string, res: Response, dev: boolean) {
    this.settings.file = file.replace('.ejs', '');
    this.res = res;
    this.dev = dev;
  }
  title(title: string): Render {
    this.settings.title = title;
    return this;
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
      { cache: !this.dev },
      (err, html) => {
        if (err) {
          console.log(chalk.red('!> Failed to render page !'));
          return this.res.status(500).send('Failed to render page !');
        }
        if (Object.keys(this.settings.global).length > 0)
          html = html.replace('$GLOBAL$', `<script>const global = ${JSON.stringify(this.settings.global)}</script>`);
        else html = html.replace('$GLOBAL$', '');
        this.res.status(this.settings.status).send(html);
      },
    );
  }
}
