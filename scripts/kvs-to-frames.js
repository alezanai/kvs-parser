const fs = require('fs');
const beamcoder = require('beamcoder');
const FrameStream = require('../lib/frame-stream.js');
const kinesisvideomedia = require('../test/mock/kinesisvideomedia.js');
const kinesisvideo = require('../test/mock/kinesisvideo.js');
const logger = require('../test/helpers/logger.js');

const getMediaParameters = {
	StartSelector: {
		StartSelectorType: 'EARLIEST',
	},
	StreamName: 'test-stream',
};

const stream = new FrameStream(getMediaParameters, {
	kinesisvideomedia,
	kinesisvideo,
	logger,
});

const encoder = beamcoder.encoder({
	name: 'mjpeg',
	width: 1920,
	height: 1080,
	pix_fmt: 'yuvj420p',
	time_base: [1, 1],
});

let id = 0;
stream.on('data', frame => {
	const filename = `tmp/test-${id}.jpg`;
	id++;
	encoder.encode(frame).then(jpeg => {
		console.log(`Writing ${filename}`);
		fs.writeFileSync(filename, jpeg.packets[0].data);
	});
});

stream.on('end', () => {
	console.log('finished stream');
});
stream.on('error', error => {
	console.log(error);
});
