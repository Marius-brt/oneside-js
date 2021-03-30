const splitRetain = require('split-retain')
const fs = require('fs')
const scriptParser = require('./scriptParser')

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

module.exports = (html, js, components) => {
    var compJs = []
    for (const [el, key] of Object.entries(components)) {
        var lines = splitRetain(html, `<${el}`, { leadingSeparator: true })
        lines.forEach((l, ind) => {
            if(l.startsWith(`<${el}`)) {
                var sp = []
                if(l.includes(`</${el}>`))
                    sp = l.split(`</${el}>`)
                else 
                    sp = l.split(`/>`)
                if(sp.length > 0) {
                    sp[0] = sp[0].replace(`<${el}`, '')
                    var args = sp[0].split("=")
                    var res = {}
                    if(args.length > 1) {
                        for(i = 0; i < args.length; i += 2) {
                            res[args[i]] = args[i + 1].split(/['`"]+/)[1]
                        }
                    }
                    var file = scriptParser(fs.readFileSync(key, "utf8"))
                    for (const [k, vl] of Object.entries(res)) {
                        file.html = file.html.replace(new RegExp(`:${k}:`, 'g'), vl)
                    }
                    compJs[el] = file.js
                    sp[0] = file.html
                    lines[ind] = sp.join('')
                }
            }
        })
        html = lines.join('')
    }
    for (const [el, key] of Object.entries(components)) {
        js += compJs[el]
    }
    return {html, js}
}