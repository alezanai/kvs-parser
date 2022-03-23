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
		stream.on('data', frame => {
			stream.destroy();
			resolve(frame);
		});

		stream.on('error', error => {
			reject(error);
		});
	});

	return firstFramePromise.then(frame => {
		t.is(frame.width, 1920);
		t.is(frame.height, 1080);
		t.is(frame.data.length, 3);
		t.is(frame.colorspace, 'unknown');
	});
});

test('FrameObjectCount', t => {
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
		console.log(count);
		count++;
	});

	const firstFramePromise = new Promise((resolve, reject) => {
		stream.on('end', () => {
			resolve(count);
		});

		stream.on('error', error => {
			reject(error);
		});
	});

	return firstFramePromise.then(count => {
		t.true(count > 100);
	});
});
