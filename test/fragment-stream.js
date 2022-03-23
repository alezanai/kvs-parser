const Buffer = require('buffer').Buffer;
const test = require('ava');
const FragmentStream = require('../lib/fragment-stream.js');
const kinesisvideomedia = require('./mock/kinesisvideomedia.js');
const kinesisvideo = require('./mock/kinesisvideo.js');
const logger = require('./helpers/logger')
 
test('FragmentTags', t => {
	const getMediaParameters = {
		StartSelector: {
			StartSelectorType: 'EARLIEST',
		},
		StreamName: 'test-stream',
	};

	const stream = new FragmentStream(getMediaParameters, {
		kinesisvideomedia,
		kinesisvideo,
		logger
	});

	let count = 0;
	const readTagsPromise = () => new Promise((resolve, reject) => {
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

	return readTagsPromise().then(() => {
		t.is(count, 16);
	});
});

test('FragmentTracks', t => {
	const getMediaParameters = {
		StartSelector: {
			StartSelectorType: 'EARLIEST',
		},
		StreamName: 'test-stream',
	};

	const stream = new FragmentStream(getMediaParameters, {
		kinesisvideomedia,
		kinesisvideo,
		logger
	});

	let count = 0;
	const readTagsPromise = () => new Promise((resolve, reject) => {
		
		stream.on('data', ({tracks}) => {
			// Tracks contains 1 track
			t.is(tracks.length, 1);
			t.is(tracks[0].TrackNumber, 1);
			t.is(tracks[0].TrackUID, 1);
			t.is(tracks[0].TrackType, 1);
			t.is(tracks[0].Name, 'kinesis_video');
			t.is(tracks[0].CodecID, 'V_MPEG4/ISO/AVC');
			t.is(tracks[0].Video.PixelWidth, 1920);
			t.is(tracks[0].Video.PixelHeight, 1080);
			t.deepEqual(tracks[0].CodecPrivate, Buffer.from([1, 100, 0, 40, 255, 225, 0, 27, 103, 100, 0, 40, 172, 43, 64, 60, 1, 19, 242, 224, 45, 64, 128, 128, 144, 0, 0, 62, 128, 0, 12, 53, 8, 244, 170, 1, 0, 5, 104, 238, 60, 176, 0]));
			count++;
		});

		stream.on('end', _ => {
			resolve();
		});

		stream.on('error', error => {
			reject(error);
		});
	});

	return readTagsPromise().then(() => {
		t.is(count, 16);
	});
});

test('FragmentTracks order', t => {
	const getMediaParameters = {
		StartSelector: {
			StartSelectorType: 'EARLIEST',
		},
		StreamName: 'test-stream',
	};

	const stream = new FragmentStream(getMediaParameters, {
		kinesisvideomedia,
		kinesisvideo,
		logger
	});

	let lastTimecode = 0;
	let lastNumberOfBlocks = null
	stream.on('data', ({cluster}) => {
		t.true(cluster.timecode > lastTimecode)
		lastNumberOfBlocks = cluster.blocks.length;
		lastTimecode = cluster.timecode
	});
	const readTagsPromise = () => new Promise((resolve, reject) => {
		stream.on('end', _ => {
			resolve();
		});

		stream.on('error', error => {
			reject(error);
		});
	});

	return readTagsPromise()
});


