const {Transform} = require('stream');
const Buffer = require('buffer').Buffer;
const beamcoder = require('beamcoder');
const FragmentStream = require('./fragment-stream.js');

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
    const { logger=console } = awsInstances
    this.logger = logger;
		const stream = new FragmentStream(getMediaParameters, awsInstances);
		stream.pipe(this);
	}

	_transform(fragment, enc, cb) {
    this.logger.debug("FrameStream: Transforming fragment", fragment.cluster.blocks.length)
		const {cluster, tracks} = fragment;
		const decoder = beamcoder.decoder({name: 'h264', width: 1920, height: 1080});
		decoder.extradata = tracks[0].CodecPrivate;
		const promises = [];

		const {timecode, blocks} = cluster;
		const framesPromise = this.decodeFrames({timecode, blocks, decoder}).then(frames => {
      this.logger.debug(`${frames.length} Frames decoded`)
			this.push(...frames);
		});
		promises.push(framesPromise);

		Promise.all(promises).then(() => {
			cb();
		}).catch(error => {
			cb(error);
		});
	}

	decodeFrames({timecode, blocks, decoder}) {
    this.logger.debug(`Decoding ${blocks.length} blocks`)
		const packet = beamcoder.packet({pts: timecode, dts: timecode, data: blocks[0].payload, stream_index: 0, size: Buffer.byteLength(blocks[0].payload)});
		return decoder.decode(packet).then(decResult => {
			if (decResult.frames.length === 0) {
				throw new Error('No Frames detected');
			} else {
				return decResult.frames;
			}
		});
	}
}

module.exports = FrameStream;
