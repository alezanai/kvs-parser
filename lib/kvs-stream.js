class KvsStream {
    constructor(getMediaParams, awsInstances = {}) {
        this.getMediaParams = getMediaParams
        this.awsInstances = awsInstances
    }
}
module.exports = KvsStream;