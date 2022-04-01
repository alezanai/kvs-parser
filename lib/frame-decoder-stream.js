const {Transform} = require('stream');
const Buffer = require('buffer').Buffer;
const beamcoder = require('beamcoder');
const FragmentStream = require('./fragment-stream.js');
const defaultLogger = require('./default-logger.js');

/**
 * FrameStream parse the AWS Kinesis video stream.
 * This class uses the (beamcoder)[https://www.npmjs.com/package/beamcoder] library to extract frames from video stream.
*/
class FrameDecoderStream extends Transform {
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

		const {logger = defaultLogger, fps = 25, trackId = 1, keyframeOnly = false} = otherParameters;

		this.logger = logger;
		this.fps = fps;
		this.trackId = trackId;
		this.keyframeOnly = keyframeOnly;
		const stream = new FragmentStream(getMediaParameters, otherParameters);
		stream.pipe(this);
		this.logger = stream.logger;
	}

	buildEncoder(encoder) {
		if (typeof (encoder) === 'object') {
			return beamcoder.encoder(encoder);
		}

		return null;
	}

	_transform(fragment, enc, cb) {
		this.logger.debug('FrameStream: Transforming fragment', fragment.cluster.blocks.length);
		const {cluster, tracks, tags} = fragment;
		const decoder = beamcoder.decoder({name: 'h264', width: 1920, height: 1080});
		decoder.extradata = tracks[0].CodecPrivate;
		const {timecode, blocks} = cluster;
		this.decodeFrames({timecode, blocks, decoder, tags}).then(() => {
			cb();
		}).catch(error => {
			cb(error);
		});
	}

	recursiveDecode({blocks, decoder, timecode, index = 0, tags}) {
		const remainingBlocks = blocks.concat();

		if (remainingBlocks.length === 0) {
			return null;
		}

		const block = remainingBlocks.shift();
		if ((this.trackId !== block.track) || (this.keyframeOnly && block.keyframe !== true)) {
			return this.recursiveDecode({blocks: remainingBlocks, timecode, index: index + 1, decoder, tags});
		}

		const pts = timecode + (index * (1000 / this.fps));
		const packet = beamcoder.packet({
			pts,
			data: block.payload,
			stream_index: this.trackId,
			size: Buffer.byteLength(block.payload),
		});

		return decoder.decode(packet).then(decResult => {
			if (decResult.frames.length === 0) {
				throw new Error(`No Frames detected in block ${index}`);
			} else {
				// This.logger.debug(`${decResult.frames.length} frames decoded in block ${index}`)
				for (const frame of decResult.frames) {
					this.push({frame, tags});
				}
			}

			return this.recursiveDecode({blocks: remainingBlocks, timecode, index: index + 1, decoder, tags});
		});
	}

	decodeFrames({timecode, blocks, decoder, tags}) {
		this.logger.debug(`Decoding ${blocks.length} blocks`);
		return this.recursiveDecode({blocks, timecode, decoder, tags});
	}
}

module.exports = FrameDecoderStream;
