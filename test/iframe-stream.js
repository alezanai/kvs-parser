const test = require('ava');
const IFrameStream = require('../lib/iframe-stream.js');
const kinesisvideomedia = require('./mock/kinesisvideomedia.js');
const kinesisvideo = require('./mock/kinesisvideo.js');
const logger = require('./helpers/logger.js');

test('TestFrameObject', t => {
	const getMediaParameters = {
		StartSelector: {
			StartSelectorType: 'EARLIEST',
		},
		StreamName: 'test-stream',
	};

	const stream = new IFrameStream(getMediaParameters, {
		kinesisvideomedia,
		kinesisvideo,
		logger,
	});

	let count = 0;
	stream.on('data', () => {
		count++;
	});

	const readIFramesPromise = new Promise((resolve, reject) => {
		stream.on('end', () => {
			resolve(count);
		});

		stream.on('error', error => {
			reject(error);
		});
	});

	return readIFramesPromise.then(count => {
		t.is(count, 16);
	});
});

test('TestFrameJPEG', t => {
	const getMediaParameters = {
		StartSelector: {
			StartSelectorType: 'EARLIEST',
		},
		StreamName: 'test-stream',
	};

	const stream = new IFrameStream(getMediaParameters, {
		kinesisvideomedia,
		kinesisvideo,
		logger,
		encoder: 'mjpeg',
	});

	let count = 0;
	stream.on('data', jpeg => {
		t.is(jpeg.type, 'packets');
		count++;
	});

	const readIFramesPromise = new Promise((resolve, reject) => {
		stream.on('end', () => {
			resolve(count);
		});

		stream.on('error', error => {
			reject(error);
		});
	});

	return readIFramesPromise.then(count => {
		t.is(count, 16);
	});
});

test('TestFrameJPEGWithEncoder', t => {
	const getMediaParameters = {
		StartSelector: {
			StartSelectorType: 'EARLIEST',
		},
		StreamName: 'test-stream',
	};

	const stream = new IFrameStream(getMediaParameters, {
		kinesisvideomedia,
		kinesisvideo,
		logger,
		encoder: {
			name: 'mjpeg',
			width: 1920,
			height: 1080,
			pix_fmt: 'yuvj420p',
			time_base: [1, 1],
		},
	});

	let count = 0;
	stream.on('data', jpeg => {
		t.is(jpeg.type, 'packets');
		count++;
	});

	const readIFramesPromise = new Promise((resolve, reject) => {
		stream.on('end', () => {
			resolve(count);
		});

		stream.on('error', error => {
			reject(error);
		});
	});

	return readIFramesPromise.then(count => {
		t.is(count, 16);
	});
});
