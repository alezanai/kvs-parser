const fs = require('fs')
const { Readable } = require('stream')

class Stream extends Readable {
    count = 0;
    filenames = []
    constructor(foldername) {
        super()
        this.filenames = fs.readdirSync(foldername)
    }

    _read() {
        if (this.count <= this.filenames.length) {
            this.push(this.filenames[this.count])
            this.count++
        } else {
            this.emit('close', 200)
        }
    }

    _destroy() {
        count = 0;
        this.filenames = null
    }
}

const kinesisvideomedia = {
    getMedia() {
        const request = {
            createReadStream() {
                return new Stream('test/data/buffers/test-stream1')
            }
        }
        return request
    }
}

module.exports = kinesisvideomedia