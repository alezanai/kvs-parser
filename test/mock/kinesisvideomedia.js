const fs = require('fs')
const { Readable } = require('stream')

let dataToStream = []
class Stream extends Readable {
    constructor(opts) {
        super(opts)
    }

    _read() {
        this.push(dataToStream.shift())
        if (!dataToStream.length) {
            this.push(null)
        }
    }

    _destroy() {
        dataToStream = null
    }
}

const kinesisvideomedia = {
    getMedia() {
        const request = {
            createReadStream() {
                dataToStream = fs.readdirSync('test/data/buffers/test-stream1')
                return new Stream()
            }
        }
        return request
    }
}

module.exports = kinesisvideomedia