const {Transform} = require('stream');
const AWS = require('aws-sdk');
const {EbmlStreamDecoder} = require('ebml-stream');

const rootTagTransform = require('./utils/root-tag-transform.js');

/**
 * KvsStream parse the AWS Kinesis video stream.
 * This class uses the (ebml-stream)[https://www.npmjs.com/package/ebml-stream] library to parse the MKV Information
*/
class KvsStream extends Transform {
	/**
	 * Constructor will getMediaParams and awsInstances as Input.
	 * @throws Will throw an error if the getMediaParams is null.
	 * @param {object} getMediaParameters - params - Parameters to how you want to retrive the  Kiensis video stream
	 * @param {object = null} awsInstances - aws instances - used to mock AWS services for local testing
	 * @example
	 * new KvsStream({ StartSelector: { StartSelectorType: 'FRAGMENT_NUMBER | SERVER_TIMESTAMP | PRODUCER_TIMESTAMP | NOW | EARLIEST | CONTINUATION_TOKEN'}, StreamName: streamName.})
	*/
	constructor(getMediaParameters, awsInstances = {}) {
		// Memory used to list the number of open main tags in the stream
		const openMainTags = [];

		super({
			transform: rootTagTransform.bind(null, openMainTags),
			readableObjectMode: true,
			writableObjectMode: true,
		});

		this.connectToKvs(getMediaParameters, awsInstances);
	}

	connectToKvs(getMediaParameters, awsInstances) {
		const kinesisvideo = awsInstances.kinesisvideo || new AWS.KinesisVideo();
		const kinesisvideomedia = awsInstances.kinesisvideomedia || new AWS.KinesisVideoMedia();
		return kinesisvideo.getDataEndPoint().promise().then(({DataEndPoint}) => {
			kinesisvideomedia.endpoint = DataEndPoint;
			const request = kinesisvideomedia.getMedia(getMediaParameters);
			const requestStream = request.createReadStream();

			const ebmlDecoder = new EbmlStreamDecoder();
			const decodedStream = requestStream.pipe(ebmlDecoder);

			decodedStream.pipe(this);
		});
	}
}
module.exports = KvsStream;
