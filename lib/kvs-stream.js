const {Readable} = require('stream');
const AWS = require('aws-sdk');
const {EbmlStreamDecoder} = require('ebml-stream');
const rootTagEncoder = require('./utils/root-tag-encoder.js');
/**
 * KvsStream parse the AWS Kinesis video stream.
 * This class uses the (ebml-stream)[https://www.npmjs.com/package/ebml-stream] library to parse the MKV Information
*/
class KvsStream extends Readable {
	/**
	 * Constructor will getMediaParams and awsInstances as Input.
	 * @throws Will throw an error if the getMediaParams is null.
	 * @param {object} getMediaParams - params - Parameters to how you want to retrive the  Kiensis video stream
	 * @param {object = null} awsInstances - aws instances - used to mock AWS services for local testing
	 * @example
	 * new KvsStream({ StartSelector: { StartSelectorType: 'FRAGMENT_NUMBER | SERVER_TIMESTAMP | PRODUCER_TIMESTAMP | NOW | EARLIEST | CONTINUATION_TOKEN'}, StreamName: streamName.})
	*/
	constructor(getMediaParameters, awsInstances = {}) {
		super();
		this.kinesisvideo = awsInstances.kinesisvideo || new AWS.KinesisVideo();
		this.kinesisvideomedia = awsInstances.kinesisvideomedia || new AWS.KinesisVideoMedia();

		const request = this.kinesisvideomedia.getMedia(getMediaParameters);
		const ebmlDecoder = new EbmlStreamDecoder();
		this.requestStream = request.createReadStream();
		this.decodedStream = this.requestStream.pipe(ebmlDecoder);
		this.videoFragmentStream = this.decodedStream.pipe(rootTagEncoder);
	}

	_read() {
		/**
		 * Data event.
		 * Returns the parsed stream data
		 * @event KvsStream#data
		 * @type {EbmlTag} see https://www.npmjs.com/package/ebml-stream
		*/
		this.videoFragmentStream.on('data', fragment => {
			this.push(JSON.stringify(fragment));
		});

		/**
		 * End event.
		 * @event KvsStream#end
		*/
		this.videoFragmentStream.on('end', _ => {
			this.push(null);
		});
	}

	_destroy() {}
}
module.exports = KvsStream;
