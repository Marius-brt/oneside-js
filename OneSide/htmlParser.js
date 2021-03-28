const splitRetain = require('split-retain')
const fs = require('fs')

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

module.exports = (html, components) => {
    for (const [el, key] of Object.entries(components)) {
        var lines = splitRetain(html, `<${el} `, { leadingSeparator: true })
        lines.forEach((l, ind) => {
            if(l.startsWith(`<${el} `)) {
                var sp = []
                if(l.includes(`</${el}>`))
                    sp = l.split(`</${el}>`)
                else 
                    sp = l.split(`/>`)
                if(sp.length > 0) {
                    sp[0] = sp[0].replace(`<${el} `, '')
                    var args = sp[0].split("=")
                    var res = {}
                    for(i = 0; i < args.length; i += 2) {
                        res[args[i]] = args[i + 1].split(/['`"]+/)[1]
                    }
                    var file = fs.readFileSync(key, "utf8")
                    for (const [k, vl] of Object.entries(res)) {
                        file = file.replace(new RegExp(`:${k}:`, 'g'), vl)
                    }
                    sp[0] = file
                    lines[ind] = sp.join('')
                }
            }
        })
        html = lines.join('')
    }
    return html
}