<div align="center" style="margin-bottom: 20px">
    <a href="https://www.npmjs.com/package/oneside">
        <img src="img/logo.png" alt="Logo" width="125">
    </a>
    <h1>OneSide</h1>
    <br>
    <img alt="npm" src="https://img.shields.io/npm/v/oneside">
    <img alt="npm" src="https://img.shields.io/npm/dt/oneside">
    <img alt="npm bundle size" src="https://img.shields.io/bundlephobia/min/oneside">
    <img alt="AppVeyor" src="https://ci.appveyor.com/api/projects/status/iy89vgvvyn1ka6g5?svg=true">
</div>

<br>

> Documentation on the [Github](https://github.com/Marius-brt/oneside-js)

OneSide is a web server that allows you to create pre-compiled dynamic website with NodeJs. With OneSide, you create the backend and the frontend of your application in a single project. OneSide uses EJS for pre-rendered pages and Express for the Http server.

[OneSide Cli](https://github.com/Marius-brt/OneSide-Cli) repo.

## Features

- 📨 Fast thanks to pre-compiled and cached pages
- ⚙️ Pre-rendered page with EJS
- 👍 Easy to use (Same structure as an Express project)
- 🔁 Live server
- ✨ Coded in TypeScript

# Quick start

Start by installing OneSide Cli on your computer. This package allows you to create a OneSide project easily and to create your website with the live server. This allows you to automatically refresh and restart your server when you modify it.

```bash
$ npm i --global oneside-cli
```

Now create a new project. To start, open the folder where you want to create your project with your cmd (a new folder will be created in it). Then enter the following command to create your project.

```bash
$ oneside init my-project
```

Then enter in your project folder and start the server using OneSide cli.

```bash
$ cd my-project
$ oneside start
```

And that's it! You are ready to code!

![cli](img/cli.png)

# Usage

Example of a basic OneSide server.

```js
const oneside = require('oneside');
const app = oneside.init({
  port: 5050,
});

app.get('/', (req, res) => {
  oneside
    .render('home', res)
    .ejs({
      message: 'Hello world !',
    })
    .send();
});

app.listen();
```

> If you like the project please start it on [Github](https://github.com/Marius-brt/oneside-js) ⭐. If you have an idea to improve OneSide or you find a bug please open an issue [here](https://github.com/Marius-brt/oneside-js/issues).
