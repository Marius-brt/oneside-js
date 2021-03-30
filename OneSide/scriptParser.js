const splitRetain = require('split-retain')

module.exports = (html) => {
    var parse = splitRetain(html, "<script", { leadingSeparator: true })
    for(i = 0; i < parse.length; i++) {
        if(parse[i].includes("</script>")) {
            parse[i] = splitRetain(parse[i], "</script>")
        } else {
            parse[i] = splitRetain(parse[i], "/>")
        }
    }
    var endHtml = ""
    var endJs = ""
    parse.forEach(el => {
        if(el.length > 1) {
            endJs += el[0]
            delete el[0]
            endHtml += el.join('')
        } else {
            if(el[0].startsWith('<script'))
                endJs += el[0]
            else
                endHtml += el[0]
        }
    })
    return {
        html: endHtml,
        js: endJs
    }
}