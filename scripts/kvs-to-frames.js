const fs = require('fs');
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
	fps: 25,
	encoder: {
		name: 'mjpeg',
		width: 1920,
		height: 1080,
		pix_fmt: 'yuvj420p',
		time_base: [1, 1],
	},
});

let frameNumber = 0;

stream.on('data', ({encoded}) => {
	const filename = `tmp/frame-${frameNumber.toString().padStart(5, '0')}.jpg`;
	console.log(`Writing file ${filename}`);
	frameNumber++;
	fs.writeFileSync(filename, encoded.packets[0].data);
});
