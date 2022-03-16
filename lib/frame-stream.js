const {Transform} = require('stream');
const KvsStream = require('./kvs-stream.js');
/**
 * FrameStream parse the AWS Kinesis video stream.
 * This class uses the (beamcoder)[https://www.npmjs.com/package/beamcoder] library to extract frames from video stream.
*/
class FrameStream extends Transform {
	/**
	 * Constructor will getMediaParams and awsInstances as Input.
	 * @param {object} getMediaParameters - see kvs-stream.js
	 * @param {object = null} awsInstances - see kvs-stream.js
	*/
	constructor(getMediaParameters, awsInstances) {
		super({
			readableObjectMode: true,
			writableObjectMode: true,
		});

		const stream = new KvsStream(getMediaParameters, awsInstances);
		stream.pipe(this);
	}

	_transform(fragment, enc, cb) {
		const tags = {};
		let error = null;

		if (fragment.idName === 'Segment') {
			for (const segmentTag of fragment.Children) {
				if (segmentTag.idName === 'Tags') {
					if (segmentTag.Children.length > 0) {
						for (const simpleTag of segmentTag.Children[0].Children) {
							const tagName = simpleTag.Children[0].data;
							const tagValue = simpleTag.Children[1].data;
							tags[tagName] = tagValue;
						}
					} else {
						error = new Error(`Tag id: ${segmentTag.id} does not have any Children`);
					}
				}
			}
		} else {
			return cb();
		}

		return cb(error, {tags});
	}
}

module.exports = FrameStream;
