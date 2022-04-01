const fs = require('fs');
const {Writable} = require('stream');
const beamcoder = require('beamcoder');
const FrameStream = require('../lib/frame-stream.js');
const kinesisvideomedia = require('../test/mock/kinesisvideomedia.js');
const kinesisvideo = require('../test/mock/kinesisvideo.js');

const getMediaParameters = {
	StartSelector: {
		StartSelectorType: 'EARLIEST',
	},
	StreamName: 'test-stream',
};

const stream = new FrameStream(getMediaParameters, {
	kinesisvideomedia,
	kinesisvideo,
});

class EncoderStream extends Writable {
	constructor() {
		super({objectMode: true});
		this.encoder = beamcoder.encoder({
			name: 'mjpeg',
			width: 1920,
			height: 1080,
			pix_fmt: 'yuvj420p',
			time_base: [1, 1],
		});
		this.frameNum = 0;
	}

	_write(frame, encoding, callback) {
		this.encoder.encode(frame).then(jpeg => {
			const filename = `tmp/frame-${this.frameNum.toString().padStart(5, '0')}.jpg`;
			console.log(`Writing file ${filename}`);
			this.frameNum++;
			fs.writeFileSync(filename, jpeg.packets[0].data);
			callback();
		}).catch(error => {
			callback(error);
		});
	}
}

const writable = new EncoderStream();

stream.pipe(writable);
