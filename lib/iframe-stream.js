const {Transform} = require('stream');
const Buffer = require('buffer').Buffer;
const beamcoder = require('beamcoder');
const FragmentStream = require('./fragment-stream.js');
const defaultLogger = require('./default-logger.js');

/**
 * IFrameStream parse the AWS Kinesis video stream.
 * This class uses the (beamcoder)[https://www.npmjs.com/package/beamcoder] library to extract frames from video stream.
*/
class IFrameStream extends Transform {
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
		const supportedEncoders = ['mjpeg', 'png'];
		const {logger = defaultLogger, encoder} = otherParameters;
		this.logger = logger;
		this.encoder = this.buildEncoder(encoder, supportedEncoders);
		const stream = new FragmentStream(getMediaParameters, otherParameters);
		stream.pipe(this);
	}

	buildEncoder(encoder, supportedEncoders) {
		if (typeof (encoder) === 'string') {
			if (supportedEncoders.includes(encoder)) {
				return beamcoder.encoder({
					name: encoder,
				});
			}

			throw new Error(`Supported Encoders are ${this.supportedEncoders}`);
		} else if (typeof (encoder) === 'object') {
			return beamcoder.encoder(encoder);
		} else {
			return null;
		}
	}

	_transform(fragment, enc, cb) {
		this.logger.debug('FrameStream: Transforming fragment', fragment.cluster.blocks.length);
		const {cluster, tracks} = fragment;
		const decoder = beamcoder.decoder({name: 'h264', width: 1920, height: 1080});
		decoder.extradata = tracks[0].CodecPrivate;
		const promises = [];

		const {timecode, blocks} = cluster;
		const framesPromise = this.decodeFrames({timecode, blocks, decoder}).then(frames => {
			this.logger.debug(`${frames.length} Frames decoded`);
			for (const frame of frames) {
				this.push(frame);
			}
		});
		promises.push(framesPromise);

		Promise.all(promises).then(() => {
			cb();
		}).catch(error => {
			cb(error);
		});
	}

	decodeFrames({timecode, blocks, decoder, trackId = 1}) {
		this.logger.debug(`Decoding ${blocks.length} blocks`);
		const recursiveDecode = (index = 0, previousDecodedFrames = []) => {
			if (index >= blocks.length) {
				return previousDecodedFrames;
			}

			if (trackId !== blocks[index].track) {
				return recursiveDecode(index + 1, previousDecodedFrames);
			}

			if (blocks[index].keyframe === true) {
				const packet = beamcoder.packet({
					pts: timecode,
					data: blocks[index].payload,
					size: Buffer.byteLength(blocks[index].payload),
				});

				return decoder.decode(packet).then(decResult => {
					if (decResult.frames.length === 0) {
						throw new Error(`No Frames detected in block ${index}/${blocks.length}`);
					} else {
						const frames = decResult.frames;
						if (this.encoder === null) {
							return frames;
						}

						this.encoder.width = frames[0].width;
						this.encoder.height = frames[0].height;
						this.encoder.pix_fmt = decoder.pix_fmt.includes('422') ? 'yuvj422p' : 'yuvj420p';
						this.encoder.time_base = decoder.time_base;
						return this.encoder.encode(frames).then(jpeg => jpeg).catch(error => {
							throw new Error(error);
						});
					}
				}).then(decodedFrames => {
					const allDecodedFrames = previousDecodedFrames.concat(decodedFrames);
					return recursiveDecode(index + 1, allDecodedFrames);
				});
			}

			return recursiveDecode(index + 1, previousDecodedFrames);
		};

		return recursiveDecode();
	}
}

module.exports = IFrameStream;
