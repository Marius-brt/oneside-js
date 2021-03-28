module.exports = (args) => {
    return (data) => {
        args.obj = data
        return {
            send: require('./send')(args),
            status: require('./status')(args),
            title: require('./title')(args)
        }
    }
}