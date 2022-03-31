const fs = require('fs');
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

const encoder = beamcoder.encoder({
	name: 'mjpeg',
	width: 1920,
	height: 1080,
	pix_fmt: 'yuvj420p',
	time_base: [1, 1],
});

let count = 0;
stream.on('data', frame => {
	encoder.encode(frame).then(jpeg => {
		const filename = `tmp/frame-${count}.jpeg`;
		console.log(`Writing file ${filename}`);
		fs.writeFileSync(filename, jpeg.packets[0].data);
		count++;
	}).catch(error => {
		throw new Error(error);
	});
});
