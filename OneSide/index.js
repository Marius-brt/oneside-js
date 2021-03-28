const fs = require('fs')
const merge = require('deepmerge')
const chalk = require('chalk')
const express = require('express')
const favicon = require('serve-favicon')
const chokidar = require('chokidar')
const path = require('path')
const htmlParser = require('./htmlParser')
const mcache = require('memory-cache')

const app = express()
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}))

var confData = {}

if(!fs.existsSync(`${process.cwd()}/app.json`)) {
    console.log(chalk.red("- app.json file not found !"));
} else {
    confData = fs.readFileSync(`${process.cwd()}/app.json`)
    if(confData != "") {
        confData = JSON.parse(confData)
    }
}

var config = {
    appIndex: "",
    port: 4050,
    paths: {
        components: "/components",
        views: "/views",
        sources: "/src"
    },
    errors: {
        "500": "",
        "404": ""
    },
    favicon: ""
}

const devMode = process.argv.length > 2 && process.argv[2].toLowerCase() == "dev"
mcache.put('devMode', devMode)
var reloadObj = null

config = merge(config, confData) 

if(config.favicon != "") {
    app.use(favicon(`${process.cwd()}/${config.favicon}`))
}

app.use(config.paths.sources, express.static(process.cwd() + '/' + config.paths.sources))

mcache.put('sample', fs.readFileSync(config.appIndex == "" ? `${__dirname}/pages/sample.html` :`${process.cwd()}/${config.appIndex}`, "utf8"))
mcache.put('err500', fs.readFileSync(config.errors[500] == "" ? `${__dirname}/pages/500.html` : `${process.cwd()}/${config.errors[500]}`, "utf8"))
mcache.put('err404', fs.readFileSync(config.errors[404] == "" ? `${__dirname}/pages/404.html` : `${process.cwd()}/${config.errors[404]}`, "utf8"))
var views = []
var components = {}

chokidar.watch(`${process.cwd()}/${config.paths.components}`).on('all', (event, at) => {
    var comp = path.basename(at).replace('.html', '').replace(/ /g, '').toLowerCase()
    if (event === 'add' || event === 'change') {
        components[comp] = at
    }
    if(event == 'unlink') {
        delete components[comp]
    }
    if(devMode && reloadObj != null) {
        reloadObj.reload()
    }
})

chokidar.watch(`${process.cwd()}/${config.paths.views}`).on('all', (event, at) => {
    if (event === 'add' || event === 'change') {
        views[path.basename(at)] = htmlParser(fs.readFileSync(at, "utf8"), components)
    }
    if(event == 'unlink') {
        delete views[path.basename(at)]
    }
    if(devMode && reloadObj != null) {
        reloadObj.reload()
    }
    mcache.put('views', views)
})

chokidar.watch(`${process.cwd()}/${config.paths.sources}`).on('all', (event, at) => {
    if(devMode && reloadObj != null) {
        reloadObj.reload()
    }
})

chokidar.watch(config.appIndex == "" ? `${__dirname}/pages/sample.html` :`${process.cwd()}/${config.appIndex}`).on('change', (at) => {
    mcache.put('sample', fs.readFileSync(at, "utf8"))
    if(devMode && reloadObj != null) {
        reloadObj.reload()
    }
})

class Server {
    get(uri = "/", callback) {
        app.get(uri, (req, res) => {
            if(typeof callback == 'function') callback(req, res)
        })
    }

    post(uri = "/", callback) {
        app.post(uri, (req, res) => {
            if(typeof callback == 'function') callback(req, res)
        })
    }

    send(res, file, data = {}) {
        return require('./src/send')({})(res, file, data)
    }

    object(data = {}) {
        return require('./src/object')({})(data)
    }

    status(code) {
        return require('./src/status')({})(code)
    }

    title(title) {
        return require('./src/title')({})(title)
    }

    notFound(res) {
        res.status(404).send(mcache.get('err404'))
    }

    public(folder) {
        app.use(`${!folder.startsWith('/') ? '/' : ''}${folder}`, express.static(`${process.cwd()}/${folder}`))
    }

    listen(callback) {        
        require('dns').lookup(require('os').hostname(), (err, add) => {            
            if(devMode) {
                const reload = require('reload')
                reload(app).then((reloadReturned) => {
                    reloadObj = reloadReturned
                    app.get('*', (req, res) => {
                        res.status(404).send(mcache.get('err404'))
                    })
                    app.listen(config.port, add, () => {
                        console.log(chalk.green(`> Server OneSide started !`))
                        if(typeof callback == 'function') callback()
                    })
                  }).catch((err) => {
                    console.error(chalk.red('- Reload could not start, could not start server/sample app', err))
                  })
            } else {
                app.get('*', (req, res) => {
                    res.status(404).send(mcache.get('err404'))
                })
                app.listen(config.port, add, () => {
                    console.log(chalk.green(`> Server OneSide started !`))
                    if(typeof callback == 'function') callback()
                })
            }
        })  
    }
}

module.exports = new Server