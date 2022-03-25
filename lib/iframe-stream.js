const {Transform} = require('stream');
const Buffer = require('buffer').Buffer;
const beamcoder = require('beamcoder');
const FragmentStream = require('./fragment-stream.js');
const defaultLogger = require('./default-logger.js');

class IFrameStream extends Transform {
	constructor(getMediaParameters, awsInstances) {
		super({
			readableObjectMode: true,
			writableObjectMode: true,
		});
		const {logger = defaultLogger} = awsInstances;
		this.logger = logger;
		const stream = new FragmentStream(getMediaParameters, awsInstances);
		stream.pipe(this);
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
						return decResult.frames;
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
