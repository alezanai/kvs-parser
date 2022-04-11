const fs = require('fs').promises;
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
	fps: 30,
	encoder: {
		name: 'mjpeg',
		width: 1920,
		height: 1080,
		pix_fmt: 'yuvj420p',
		time_base: [1, 1],
	},
});

let frameNumber = 0;
const startDate = new Date();

stream.on('data', ({encoded}) => {
	const currentDate = new Date();
	const filename = `tmp/frame-${frameNumber.toString().padStart(5, '0')}.jpg`;
	const fps = frameNumber * 1000 / (currentDate.getTime() - startDate.getTime());

	console.log(`Writing file ${filename} at ${fps}`);
	frameNumber++;

	return fs.writeFile(filename, encoded.packets[0].data).then(() => new Promise(resolve => {
		setTimeout(resolve, 5000);
	}));
});

// Stream.pause();

