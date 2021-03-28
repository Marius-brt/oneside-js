module.exports = (args) => {
    return (title) => {
        args.title = title
        return {
            send: require('./send')(args),
            status: require('./status')(args),
            object: require('./object')(args)
        }
    }
}