/**
 * FrawmeStream parse the AWS Kinesis video stream.
 * This class uses the (beamcoder)[https://www.npmjs.com/package/beamcoder] library to extract frames from video stream.
*/
class FrameStream {
	/**
     * Constructor will getMediaParams and awsInstances as Input.
     * @throws Will throw an error if the getMediaParams is null.
     * @param {object} getMediaParams - params - Parameters to how you want to retrive the  Kiensis video stream
     * @param {object = null} awsInstances - aws instances - used to mock AWS services for local testing
     * @example
     * new KvsStream({ StartSelector: { StartSelectorType: 'FRAGMENT_NUMBER | SERVER_TIMESTAMP | PRODUCER_TIMESTAMP | NOW | EARLIEST | CONTINUATION_TOKEN'}, StreamName: streamName.})
    */
	constructor(getMediaParameters, awsInstances = {}) {
		this.getMediaParams = getMediaParameters;
		this.awsInstances = awsInstances;
	}
}

module.exports = FrameStream;
