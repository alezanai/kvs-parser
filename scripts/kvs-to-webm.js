const {KvsStream} = require('..');
const kinesisvideomedia = require('../test/mock/kinesisvideomedia.js');
const kinesisvideo = require('../test/mock/kinesisvideo.js');
const {EbmlStreamEncoder} = require('ebml-stream');
const fs = require('fs');

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

const ebmlEncoder = new EbmlStreamEncoder();
let count = 0;
stream.pipe(ebmlEncoder).on('data', data => {
	const filename = `tmp/firstchunk-${Math.floor(count / 2)}.webm`;
	console.log(`Writing info into ${filename}`)
	fs.appendFileSync(filename, data);
	count++;
});
