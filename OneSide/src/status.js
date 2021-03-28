module.exports = (args) => {
    return (code) => {
        args.code = code
        return {
            send: require('./send')(args),
            title: require('./title')(args),
            object: require('./object')(args)
        }
    }
}