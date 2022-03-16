const test = require('ava');
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
		stream.on('data', ({tags}) => {
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

