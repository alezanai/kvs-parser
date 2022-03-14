const test = require('ava');
const KvsStream = require('../lib/kvs-stream.js');
// This is mock version of aws services, those mock will always return the same mkv buffers saved in './test/data/buffers/test-buffer-XXXXX.mkv'
// it is made to make the unit test reproductible and to not test the AWS API here
const kinesisvideomedia = require('./mock/kinesisvideomedia.js');
const kinesisvideo = require('./mock/kinesisvideo.js');

test('KvsStream', t => {
	const getMediaParameters = {
		StartSelector: {
			StartSelectorType: 'EARLIEST',
		},
		StreamName: 'test-stream',
	};

	const stream = new KvsStream(getMediaParameters, {
		kinesisvideomedia,
		kinesisvideo,
	});

	const readStreamPromise = () => new Promise((resolve, reject) => {
		let ebmlDataTag = {};
		stream.on('data', fragment => {
			ebmlDataTag = fragment;
		});

		stream.on('end', _ => {
			console.log('Ending Stream');
			resolve(ebmlDataTag);
		});

		stream.on('error', error => {
			console.log('Error', error);
			reject(error);
		});
	});

	return readStreamPromise().then(ebmlDataTag => {
		t.is(typeof (ebmlDataTag.id), 'number');
	});
});
