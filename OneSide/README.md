<div align="center" style="margin-bottom: 20px">
    <a href="https://github.com/Marius-brt/oneside-js">
        <img src="https://raw.githubusercontent.com/Marius-brt/oneside-js/master/logo.png" alt="Logo" width="125">
    </a>
    <p style="font-size: 20px; font-weight: 600; margin-bottom: 30px">OneSide</p>
    <img alt="npm" src="https://img.shields.io/npm/v/oneside">
    <img alt="npm" src="https://img.shields.io/npm/dw/oneside">
    <img alt="npm bundle size" src="https://img.shields.io/bundlephobia/min/oneside">
</div>

OneSide is a web server that allows you to create a website with NodeJs. With OneSide, you create the backend and the frontend of your application in a single project. OneSide uses Express for the HTTP server.

# Quick start

Start by installing OneSide Cli on your computer. This package allows you to create a OneSide project easily and to create your website with the live server. This allows you to automatically refresh and restart your server when you modify it.

```bash
npm i --global oneside-cli
```

Now create a new project. To start, open the folder where you want to create your project with your cmd (a new folder will be created in it). Then enter the following command to create your project.

```bash
oneside init my-project
```

Then follow the commands shown to start your server.

# Usage

Example of a basic OneSide server.

```js
const oneside = require('oneside')

oneside.get('/', (req, res) => {
    oneside.send(res, "home.html", {
        username: "Steve"
    })
})

oneside.listen()
```

# Documentation

For more information on how to use OneSide, read the documentation on the [Github](https://github.com/Marius-brt/oneside-js)