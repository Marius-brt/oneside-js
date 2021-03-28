const mcache = require('memory-cache')

module.exports = (args) => {
    return (res, file, data = {}) => {
        args = Object.assign({}, {
            code: 200,
            title: '',
            obj: {}
        }, args)
        var fl = mcache.get('views')[file]
        if(fl == undefined) {
            res.status(500).send(mcache.get('err500'))
        } else {
            for (const [key, value] of Object.entries(data)) {
                fl = fl.replace(new RegExp(`:${key}:`, 'g'), value)
            }
            var sample = mcache.get('sample')
            if(args.title != '') {
                if(sample.includes('<title>')) {
                    var f = sample.split('<title>')
                    var s = f[1].split('</title>')
                    s[0] = `<title>${args.title}</title>`
                    sample = f[0] + s.join('')
                } else {
                    sample = addAfter(sample, '<head>', `<title>${args.title}</title>`)
                }
            }
            res.status(args.code).send(addAfter(sample, "<body>", fl + (mcache.get('devMode') ? `<script src="/reload/reload.js"></script>` : '')).replace(new RegExp("oneside.data", 'g'), JSON.stringify(args.obj)))
        }
    }
}

function addAfter(str, find, toAdd) {
    return str.splice(str.indexOf(find) + find.length, 0, toAdd)
}

String.prototype.splice = function (idx, rem, str) {
    return this.slice(0, idx) + str + this.slice(idx + Math.abs(rem));
}