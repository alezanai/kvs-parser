const beamcoder = require('beamcoder');

async function run() {
	const demuxer = await beamcoder.demuxer('tmp/get_media.mkv');
	console.log(JSON.stringify(demuxer));
	const decoder = beamcoder.decoder({name: 'h264'});

	let packet = {};
	for (let x = 0; x < 1000 && packet !== null; x++) {
		packet = await demuxer.read();
		if (packet && packet.stream_index === 0) {
			const frames = await decoder.decode(packet);
			console.log(frames);
		}
	}
}

run();
