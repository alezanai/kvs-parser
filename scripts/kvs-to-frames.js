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

let count = 0;
stream.on('data', frame => {
	const encoder = beamcoder.encoder({
		name: 'mjpeg',
		width: frame.width,
		height: frame.height,
		pix_fmt: 'yuvj420p',
		time_base: [1, 1],
	});
	count ++;
	const frameNum = count;
	return encoder.encode(frame).then(jpeg => {
		const filename = `tmp/frame-${frameNum.toString().padStart(5, '0')}.jpg`;
		console.log(`Writing file ${filename}`);
		fs.writeFileSync(filename, jpeg.packets[0].data);
		
	}).catch(error => {
		throw new Error(error);
	});
});
