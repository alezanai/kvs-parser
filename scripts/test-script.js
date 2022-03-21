const fs = require('fs');
const beamcoder = require('beamcoder');

function run() {
	const demuxer = beamcoder.demuxer('tmp/firstchunk-4.webm');
	demuxer.then(demux => {
		const decoder = beamcoder.decoder({name: 'h264'});
		let packet = {};
		for (let x = 0; x < 1000 && packet !== null; x++) {
			packet = demux.read();
			packet.then(pkt => {
				if (pkt && pkt.stream_index === 0) {
					// Here we are decoding frames from webm file.
					decoder.decode(pkt).then(data => {
						if (data.frames.length > 0) {
							// Here we got the frame object but didn't get any information regarding frames.
							console.log('Width', data.frames[0].width);
							console.log('Height', data.frames[0].height);
							const enc = beamcoder.encoder({
								name: 'mjpeg',
								width: decoder.width,
								height: decoder.height,
								pix_fmt: 'yuvj422p',
								time_base: [1, 1],
							});
							return enc.encode(data.frames[0]);
						}
					}).then(jpeg => {
						// Didn't get here
						if (jpeg) {
							console.log(jpeg);
							fs.writeFileSync('tmp/data.jpeg', jpeg);
						}
					}).catch(error => {
						// Got error while saving as jpeg
						console.log(error);
					});
				}
			});
		}
	}); // Create a demuxer for a file
}

run();
