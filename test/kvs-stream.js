const test = require('ava')
const KvsStream = require('../lib/kvs-stream')
// this is mock version of aws services, those mock will always return the same mkv buffers saved in './test/data/buffers/test-buffer-XXXXX.mkv'
// it is made to make the unit test reproductible and to not test the AWS API here
const kinesisvideomedia = require('./mock/kinesisvideomedia');
const kinesisvideo = require('./mock/kinesisvideo');

test('KvsStream', t => {
    const getMediaParams = {
        StartSelector: {
            StartSelectorType: 'EARLIEST'
        },
        StreamName: 'test-stream'
    };

    const stream = new KvsStream(getMediaParams, {
        kinesisvideomedia,
        kinesisvideo
    });

    const request = stream.awsInstances.kinesisvideomedia.getMedia()
    const streamData = request.createReadStream();

    const readStreamPromise = () => {
        return new Promise((resolve, reject) => {
            let count = 0;
            stream.on('data', buffer => {
                console.log(buffer);
                count++
            });

            stream.on('close', code => {
                console.log("Closing stream with code", code);
                resolve(count)
            })

            stream.on('error', err => {
                console.log("Error", err);
                reject(err)
            })

        })
    }

    return readStreamPromise().then(data => {
        t.is(data, 1100)
    });
})
