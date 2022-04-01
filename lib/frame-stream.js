const {Transform} = require('stream');
const FrameDecoderStream = require('./frame-decoder-stream.js');
const EncoderStream = require('./encoder-stream.js');
/**
 * FrameStream parse the AWS Kinesis video stream.
 * This class uses the (beamcoder)[https://www.npmjs.com/package/beamcoder] library to extract frames from video stream.
*/
class FrameStream extends Transform {
	/**
	 * Constructor will getMediaParams and otherParameters as Input.
	 * @param {object} getMediaParameters - see kvs-stream.js
	 * @param {object} otherParameters - otherParameters contains objects like { kinesisvideo, kinesisvideomedia, encoder, logger }
	*/
	constructor(getMediaParameters, otherParameters) {
		super({
			readableObjectMode: true,
			writableObjectMode: true,
		});
		const {encoder} = otherParameters;
		const stream = new FrameDecoderStream(getMediaParameters, otherParameters);
		const encoderTransformStream = new EncoderStream(encoder);

		stream.pipe(encoderTransformStream).pipe(this);

		this.logger = stream.logger;
	}

	_transform(chunk, encoding, callback) {
		callback(null, chunk);
	}
}

module.exports = FrameStream;
