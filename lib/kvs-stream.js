class KvsStream {
    constructor(getMediaParams, s3Instances = {}) {
        this.getMediaParams = getMediaParams
        this.s3Instances = s3Instances
    }
}
module.exports = KvsStream;