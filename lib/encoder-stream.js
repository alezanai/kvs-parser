const {Transform} = require('stream');
const beamcoder = require('beamcoder');

class EncoderStream extends Transform {
	constructor(encoderParameters) {
		super({
			readableObjectMode: true,
			writableObjectMode: true,
		});
		this.encoder = this.buildEncoder(encoderParameters);
	}

	buildEncoder(encoderParameters) {
		if (typeof (encoderParameters) === 'object') {
			return beamcoder.encoder(encoderParameters);
		}

		return null;
	}

	_transform(object, encoding, callback) {
		if (this.encoder) {
			const {frame} = object;
			this.encoder.encode(frame).then(data => {
				callback(null, Object.assign({}, object, {encoded: data}));
			}).catch(error => {
				callback(error);
			});
		} else {
			callback(null, object);
		}
	}
}

module.exports = EncoderStream;
