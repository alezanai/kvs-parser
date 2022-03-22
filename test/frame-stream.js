const test = require('ava');
const FrameStream = require('../lib/frame-stream.js');
const kinesisvideomedia = require('./mock/kinesisvideomedia.js');
const kinesisvideo = require('./mock/kinesisvideo.js');

test('FrameObject', t => {
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

	const firstFramePromise = new Promise((resolve, reject) => {
		stream.on('data', ({frame}) => {
			stream.destroy();
			resolve(frame);
		});

		stream.on('error', error => {
			reject(error);
		});
	});

	return firstFramePromise.then(frame => {
		t.is(frame.weight, 1920);
		t.is(frame.height, 1920);
		t.is(frame.data.length, 12_345);
		t.is(frame.colorspace, 'bt709');
	});
});
