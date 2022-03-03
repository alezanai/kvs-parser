const test = require('ava')
const KvsStream = require('../lib/kvs-stream')
// this is mock version of aws services, those mock will always return the same mkv buffers saved in './test/data/buffers/test-buffer-XXXXX.mkv'
// it is made to make the unit test reproductible and to not test the AWS API here
const kinesisvideomedia = require('./mock/kinesisvideomedia.js');
const kinesisvideo = require('./mock/kinesisvideo.js');

test('KvsStream', t => {
    const getMediaParams = {
        StartSelector: {
            StartSelectorType: 'EARLIEST'
        },
        StreamName: streamName
    };

    const stream = new KvsStream(getMediaParams, {
        kinesisvideomedia,
        kinesisvideo
    });
})