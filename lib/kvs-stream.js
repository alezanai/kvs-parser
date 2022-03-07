/** 
 * KvsStream Class is responsible for parse the Kinesis video stream of AWS.
 * This class uses the (ebml-stream)[https://www.npmjs.com/package/ebml-stream] library to parse the raw Kvs Information,
 * and (beamcoder)[https://www.npmjs.com/package/beamcoder] library to parse all the frames from Kinesis Video Stream.
*/
class KvsStream {
    /**
     * Constructor will getMediaParams and S3Instances as Input.
     * @throws Will throw an error if the getMediaParams is null.
     * @param {object} getMediaParams - { StartSelector: { StartSelectorType: 'FRAGMENT_NUMBER | SERVER_TIMESTAMP | PRODUCER_TIMESTAMP | NOW | EARLIEST | CONTINUATION_TOKEN'}, StreamName: streamName.}
     * @param {object} s3Instances - S3 Bucket information.
    */
    constructor(getMediaParams, s3Instances = {}) {
        throw (new Error('not implemented'))
    }


    /** Emit the parsed data of Kinesis video stream. */
    data() { }


    /** Emit the stream closed event. */
    close() { }
}

/**
 * Throw a Data Event.
 *
 * @fires KvsStream#data
*/
KvsStream.prototype.data = function () {
    /**
     * Data event.
     * Returns the parsed stream data
     * @event KvsStream#data
     * @type {object}
    */
    this.emit('data', {

    });
}

/**
 * Throw a Close Event.
 *
 * @fires KvsStream#close
*/
KvsStream.prototype.close = function () {
    /**
     * Close event.
     * Returns the closed stream message
     * @event KvsStream#close
     * @type {string}
    */
    this.emit('close', {

    });
}

module.exports = KvsStream