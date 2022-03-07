const fs = require('fs')

const kinesisvideomedia = {
    getMedia(params) {
        const files = fs.readdirSync('test/data/buffers/test-stream1')
        for (let file in files) {
            return file;
        }
    }
}

module.exports = kinesisvideomedia