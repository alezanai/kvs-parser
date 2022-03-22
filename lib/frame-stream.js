const {Transform} = require('stream');
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

		const stream = new FragmentStream(getMediaParameters, awsInstances);
		stream.pipe(this);
	}

	_transform(fragment, enc, cb) {
		const {blocks, tracks} = fragment;
		const decoder = beamcoder.decoder({name: 'h264'});
		decoder.extradata = tracks[0].CodecPrivate;
		const promises = [];
		for (const block of blocks) {
			const {timecode, payload} = block;
			const framesPromise = this.decodeFrames({timecode, payload, decoder}).then(frames => {
				this.push(...frames);
			});
			promises.push(framesPromise);
		}

		Promise.all(promises).then(() => {
			cb();
		}).catch(error => {
			cb(error);
		});
	}

	decodeFrames({timecode, payload, decoder}) {
		const packet = beamcoder.packet({pts: timecode, dts: timecode, data: payload});
		return new Promise((resolve, reject) => {
			console.log(JSON.stringify(packet, null, 4));
			console.log(JSON.stringify(decoder, null, 4));
			decoder.decode(packet).then(decResult => {
				if (decResult.frames.length === 0) {
					throw new Error('No Frames detected');
				} else {
					const enc = beamcoder.encoder({
						name: 'mjpeg',
						width: decoder.width,
						height: decoder.height,
						pix_fmt: 'yuvj420p',
						time_base: [1, 1],
					});
					enc.encode(decResult.frames[0]).then(jpeg => {
						resolve(jpeg);
					});
				}
			}).catch(error => {
				reject(error);
			});
		});
	}
}

module.exports = FrameStream;
