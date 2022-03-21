const {Transform} = require('stream');
const beamcoder = require('beamcoder');
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
		if (fragment.idName === 'Segment') {
			const segmentTags = fragment.Children.filter(a => a.idName === 'Tags');
			this.getTags(segmentTags, cb);

			// Const clusterTag = fragment.Children.find(a => a.idName === 'Cluster');
			// this.getFrames(clusterTag, cb);
		} else {
			cb();
		}
		// Else
	}

	getTags(segmentTags, cb) {
		const tags = {};
		for (const segmentTag of segmentTags) {
			if (segmentTag.Children.length === 1) {
				if (segmentTag.Children[0].Children.length > 0) {
					for (const simpleTag of segmentTag.Children[0].Children) {
						if (simpleTag.Children.length === 2) {
							const tagName = simpleTag.Children[0].data;
							const tagValue = simpleTag.Children[1].data;
							tags[tagName] = tagValue;
						} else {
							throw new Error(`SimpleTag id: ${simpleTag.id} have ${simpleTag.Children.length} Children`);
						}
					}
				} else {
					throw new Error(`Tag id: ${segmentTag.Children[0].id} does not have any Children`);
				}
			} else {
				throw new Error(`SegmentTag id: ${segmentTag.id} does not have any Children`);
			}
		}

		cb(null, {tags});
	}

	getFrames(segmentTag, cb) {
		let timecode = null;
		let payload = null;
		for (const clusterTag of segmentTag.Children) {
			if (clusterTag.idName === 'Timecode') {
				timecode = clusterTag.data;
			} else if (clusterTag.idName === 'SimpleBlock') {
				payload = clusterTag.payload;
			}
		}

		if (timecode !== null && payload !== null) {
			const packet = beamcoder.packet({pts: timecode, dts: timecode, data: payload});
			this.decodeFrame(packet, cb);
		} else {
			cb(new Error('Timecode or Payloadis null'));
		}
	}

	decodeFrame(packet, cb) {
		console.log(JSON.stringify(packet, null, 4));
		const object = {
			name: 'h264',
			height: 1080,
			width: 1920,
			// Pix_fmt: "yuv420p"
		};
		const decoder = beamcoder.decoder(object);
		const decodePromise = decoder.decode(packet);
		console.log(JSON.stringify(decoder, null, 4));
		decodePromise.then(decResult => {
			console.log(JSON.stringify(decResult));
			if (decResult.frames.length === 0) {
				throw new Error('No Frames detected');
			} else {
				cb(null, decResult.frames[0]);
			}
		}).catch(error => {
			cb(error);
		});
	}
}

module.exports = FrameStream;
