const fs = require('fs');
const test = require('ava');
const beamcoder = require('beamcoder');
const FrameStream = require('../lib/frame-stream.js');
const kinesisvideomedia = require('./mock/kinesisvideomedia.js');
const kinesisvideo = require('./mock/kinesisvideo.js');

test('FrameStream', t => {
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
	const readStreamPromise = () => new Promise((resolve, reject) => {
		stream.on('data', ({ tags }) => {
			// Tags contains
			t.is(typeof (tags.AWS_KINESISVIDEO_CONTINUATION_TOKEN), 'string');
			t.is(typeof (tags.AWS_KINESISVIDEO_FRAGMENT_NUMBER), 'string');
			t.is(typeof (tags.AWS_KINESISVIDEO_SERVER_TIMESTAMP), 'string');
			t.is(typeof (tags.AWS_KINESISVIDEO_PRODUCER_TIMESTAMP), 'string');
			t.is(typeof (tags.AWS_KINESISVIDEO_ERROR_CODE), 'undefined');
			t.is(typeof (tags.AWS_KINESISVIDEO_ERROR_ID), 'undefined');
			count++;
		});

		stream.on('end', _ => {
			resolve();
		});

		stream.on('error', error => {
			reject(error);
		});
	});

	return readStreamPromise().then(() => {
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
	});

	const enc = beamcoder.encoder({ // Create an encoder for JPEG data
		name: 'mjpeg', // FFmpeg does not have an encoder called 'jpeg'
		width: 1080,
		height: 1920,
		pix_fmt: 'yuvj422p',
		time_base: [1, 1],
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
		t.is(frame.weight, 1920)
		t.is(frame.height, 1920)
		t.is(frame.data.length, 12345)
		t.is(frame.colorspace, 'bt709')
		return enc.encode(frame)
	})
});
