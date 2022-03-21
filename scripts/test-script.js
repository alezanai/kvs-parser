const fs = require('fs');
const beamcoder = require('beamcoder');

function run() {
	const demuxer = beamcoder.demuxer('tmp/firstchunk-4.webm');
	return demuxer.then(demux => {
		const decoder = beamcoder.decoder({name: 'vp8'});
		const packet = {};
		return readPacket({demux, decoder}).then(() => readPacket({demux, decoder}));
	}); // Create a demuxer for a file
}

function readPacket({demux, decoder}) {
	return demux.read().then(pkt => {
		console.log(JSON.stringify(pkt, null, 4));
		if (pkt && pkt.stream_index === 0) {
			// Here we are decoding frames from webm file.
			console.log(JSON.stringify(decoder, null, 4));
			return decoder.decode(pkt).then(data => {
				if (data.frames.length > 0) {
					console.log(JSON.stringify(data));
					console.log(data.frames.length);
					// Here we got the frame object but didn't get any information regarding frames.
					console.log(decoder.width);
					console.log(decoder.height);
					console.log('Width', data.frames[0].width);
					console.log('Height', data.frames[0].height);
					const enc = beamcoder.encoder({
						name: 'mjpeg',
						width: decoder.width,
						height: decoder.height,
						pix_fmt: 'yuvj420p',
						time_base: [1, 1],
					});
					return enc.encode(data.frames[0]).then(jpeg => {
						// Didn't get here
						if (jpeg) {
							console.log(jpeg.packets[0].data);
							fs.writeFileSync('tmp/data.jpeg', jpeg.packets[0].data);
						}
					});
				}

				console.log('No Frames');
				return null;
			}).catch(error => {
				// Got error while saving as jpeg
				console.log(error);
			});
		}

		throw new Error('Invalid Packet');
	});
}

run();
