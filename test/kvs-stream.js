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
	let count = 0;
	const readStreamPromise = () => new Promise((resolve, reject) => {
		stream.on('data', fragment => {
			t.is(typeof (fragment.id), 'number');
			t.is(typeof (fragment.type), 'string');
			t.true(['m', 'u', 'b'].includes(fragment.type), `type ${fragment.type} is not expected as mater tag`);

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
		t.is(count, 251);
	});
});
