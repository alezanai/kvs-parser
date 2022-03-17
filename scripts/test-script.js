const beamcoder = require('beamcoder');

async function run() {
    let demuxer = await beamcoder.demuxer('/home/dharmik/Downloads/2019-05-10_R1C1_A.mp4'); // Create a demuxer for a file
    let decoder = beamcoder.decoder({ name: 'h264' }); // Codec asserted. Can pass in demuxer.
    let packet = {};
    for (let x = 0; x < 1000 && packet != null; x++) {
        packet = await demuxer.read(); // Read next frame. Note: returns null for EOF
        if (packet && packet.stream_index === 0) { // Check demuxer to find index of video stream
            let frames = await decoder.decode(packet);
            console.log("Frame", frames)
            // Do something with the frame data
            // console.log(x, frames.total_time); // Optional log of time taken to decode each frame
        }
    }
    let frames = await decoder.flush(); // Must tell the decoder when we are done
    console.log('flush', frames.total_time, frames.length);
}

run();