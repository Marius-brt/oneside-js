const mcache = require('memory-cache')

String.prototype.extract = function(prefix, suffix) {
	s = this;
	var i = s.indexOf(prefix);
	if (i >= 0) {
		s = s.substring(i + prefix.length);
	}
	else {
		return '';
	}
	if (suffix) {
		i = s.indexOf(suffix);
		if (i >= 0) {
			s = s.substring(0, i);
		}
		else {
		  return '';
		}
	}
	return s;
};

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
                fl.html = fl.html.replace(new RegExp(`:${key}:`, 'g'), value)
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
            sample = addAfter(sample, `<body${sample.extract('<body', '>')}>`, fl.html)
            if(mcache.get('devMode')) {
                fl.js = `<script src="/reload/reload.js"></script>` + fl.js
            }
            sample = sample.split('</body>')
            if(sample.length > 1) {
                res.status(args.code).send((sample[0] + fl.js + sample[1]).replace(new RegExp("oneside.data", 'g'), JSON.stringify(args.obj)))
            } else {
                res.status(args.code).send((sample[0] + fl.js).replace(new RegExp("oneside.data", 'g'), JSON.stringify(args.obj)))
            }            
        }
    }
}

function addAfter(str, find, toAdd) {
    return str.splice(str.indexOf(find) + find.length, 0, toAdd)
}

String.prototype.splice = function (idx, rem, str) {
    return this.slice(0, idx) + str + this.slice(idx + Math.abs(rem));
}