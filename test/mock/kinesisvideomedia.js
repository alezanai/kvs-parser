const fs = require('fs');
const {Readable} = require('stream');

class Stream extends Readable {
	constructor(folder) {
		super();
		this.filenames = fs.readdirSync(folder);
		this.folder = folder;
		this.count = 0;
	}

	_read() {
		if (this.count < this.filenames.length) {
			const filename = this.filenames[this.count];
			const filepath = this.folder + '/' + filename;
			this.push(fs.readFileSync(filepath));
			this.count++;
		} else {
			this.push(null);
		}
	}

	_destroy() {
		this.count = 0;
		this.filenames = null;
	}
}

const kinesisvideomedia = {
	getMedia() {
		const request = {
			createReadStream() {
				return new Stream('test/data/buffers/test-stream1');
			},
		};
		return request;
	},
};

module.exports = kinesisvideomedia;
