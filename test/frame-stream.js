const test = require('ava');
const FrameStream = require('../lib/frame-stream.js');
const kinesisvideomedia = require('./mock/kinesisvideomedia.js');
const kinesisvideo = require('./mock/kinesisvideo.js');

const logger = require('./helpers/logger')

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
		logger
	});
	let lastPts = null
	stream.on('data', frame => {
		if(lastPts){
			t.true(frame.pts > lastPts)
		} 
		
		lastPts = frame.pts
		t.is(frame.width, 1920);
		t.is(frame.height, 1080);
		t.is(frame.data.length, 3);
		t.is(frame.colorspace, 'unknown');
	});
	const streamEnds = new Promise((resolve, reject) => {

		stream.on('end', frame => {
			resolve()
		});
		stream.on('error', error => {
			reject(error);
		});
	});

	return streamEnds
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
		logger
	});

	let count = 0;
	stream.on('data', frame => {
		// console.log(`test/framestream.js: ${count}`);
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
