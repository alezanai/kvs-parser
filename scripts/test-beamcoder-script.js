const beamcoder = require('beamcoder');

async function run() {
	const demuxer = await beamcoder.demuxer('tmp/get_media.mkv');
	console.log(JSON.stringify(demuxer));
	const decoder = beamcoder.decoder({name: 'h264'});
	decoder.extradata = demuxer.streams[0].codecpar.extradata;

	let packet = {};
	for (let x = 0; x < 10 && packet !== null; x++) {
		packet = await demuxer.read();
		if (packet && packet.stream_index === 0) {
			const data = await decoder.decode(packet);
			const enc = beamcoder.encoder({
				name: 'mjpeg',
				width: decoder.width,
				height: decoder.height,
				pix_fmt: 'yuvj420p',
				time_base: [1, 1],
			});
			const jpeg = await enc.encode(data.frames[0]);
		}
	}
}

run();
