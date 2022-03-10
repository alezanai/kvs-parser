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
		let count = 0;
		stream.on('data', buffer => {
			console.log(buffer);
			count++;
		});

		stream.on('end', _ => {
			console.log('Ending Stream');
			resolve(count);
		});

		stream.on('error', error => {
			console.log('Error', error);
			reject(error);
		});
	});

	return readStreamPromise().then(count => {
		t.is(count, 1100);
	});
});
