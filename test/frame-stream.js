const test = require('ava');
const FrameStream = require('../lib/frame-stream.js');

const kinesisvideomedia = require('./mock/kinesisvideomedia.js');
const kinesisvideo = require('./mock/kinesisvideo.js');
const logger = require('./helpers/logger.js');

test('TestFrameObject 0', t => {
	const getMediaParameters = {
		StartSelector: {
			StartSelectorType: 'EARLIEST',
		},
		StreamName: 'test-stream',
	};

	const stream = new FrameStream(getMediaParameters, {
		keyframeOnly: true,
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

test('TestFrameJPEGWithEncoder', t => {
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
		keyframeOnly: true,
		encoder: {
			name: 'mjpeg',
			width: 1920,
			height: 1080,
			pix_fmt: 'yuvj420p',
			time_base: [1, 1],
		},
	});

	let count = 0;
	stream.on('data', ({encoded}) => {
		t.is(encoded.type, 'packets');
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
		logger,
	});
	let lastPts = null;
	stream.on('data', ({frame}) => {
		if (lastPts) {
			t.true(frame.pts + 25 >= lastPts);
		}

		lastPts = frame.pts;
		t.is(frame.width, 1920);
		t.is(frame.height, 1080);
		t.is(frame.data.length, 3);
		t.is(frame.colorspace, 'unknown');
	});
	const streamEnds = new Promise((resolve, reject) => {
		stream.on('end', () => {
			resolve();
		});
		stream.on('error', error => {
			reject(error);
		});
	});

	return streamEnds;
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
		logger,
	});

	let count = 0;
	stream.on('data', () => {
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

test('TestProducerTimestamp', t => {
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
		fps: 30,
		encoder: {
			name: 'mjpeg',
			width: 1920,
			height: 1080,
			pix_fmt: 'yuvj420p',
			time_base: [1, 1],
		},
	});

	let count = 0;
	let previousTimestamp;
	stream.on('data', ({tags}) => {
		const currentTimestamp = tags.AWS_KINESISVIDEO_PRODUCER_TIMESTAMP;
		if (previousTimestamp) {
			t.true(previousTimestamp !== currentTimestamp);
		}

		previousTimestamp = currentTimestamp;
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
		t.is(count, 130);
	});
});
