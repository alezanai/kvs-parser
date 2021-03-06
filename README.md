# Kinesis Video Stream Parser Library in Node.js

Unofficial Node.js [Kinesis Video Stream](https://aws.amazon.com/kinesis/video-streams/) Parser Library, provided without any warranty, and not by AWS.

This library is using 
* [ebml-stream](https://www.npmjs.com/package/ebml-stream)
* [beamcoder](https://www.npmjs.com/package/beamcoder)

## Features

The lib exposes stream to manipulate the kinesis video streams.
It is exposed at different level (from higher-level to lower-level)

* `FrameStream` : higher-level API, stream each frame one by one
* `FragmentStream` : stream the matroska segments as an object `{tracks, cluster, tags}` for each segment
* `KvsStream` : stream the matroska raw content of the kvs stream as [ebml-stream](https://www.npmjs.com/package/ebml-stream) elements

## Context

* The existing parser library is [in Java](https://docs.aws.amazon.com/kinesisvideostreams/latest/dg/parser-library.html)
* The existing [getMedia](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/KinesisVideoMedia.html#getMedia-property) is a little bit [tricky](https://stackoverflow.com/questions/53921074/how-to-get-metadata-from-amazon-kinesis-video-streams-via-video-js-and-http-stre/71298009#71298009) to use.

## Installation

You need to have ffmpeg libraries on your system, see [beamcoder installation instructions](https://github.com/Streampunk/beamcoder#installation).

```
npm install kvs-parser
```

# Usage

## FrameStream

FrameStream is decoding the fragments and then extract frame for each fragment

### Example


```js
const fs = require('fs');
const {FrameStream} = require('kvs-parser');

// see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/KinesisVideoMedia.html#getMedia-property
const getMediaParams = {
 StartSelector: { /* required */
    StartSelectorType: FRAGMENT_NUMBER | SERVER_TIMESTAMP | PRODUCER_TIMESTAMP | NOW | EARLIEST | CONTINUATION_TOKEN, /* required */
    AfterFragmentNumber: 'STRING_VALUE',
    ContinuationToken: 'STRING_VALUE',
    StartTimestamp: new Date || 'Wed Dec 31 1969 16:00:00 GMT-0800 (PST)' || 123456789
  },
  StreamARN: 'STRING_VALUE',
  StreamName: 'STRING_VALUE'
};

const stream = new FrameStream(getMediaParameters, {
	fps: 30, // fps here is used to set the pts of each frame in beamcoder
	encoder: {// 
		name: 'mjpeg',
		width: 1920,
		height: 1080,
		pix_fmt: 'yuvj420p',
		time_base: [1, 1],
	}
});


let frameNum = 0;

stream.on('data', ({encoded, tags, frame}) => {
	const filename = `tmp/frame-${frameNum.toString().padStart(5, '0')}.jpg`;
	console.log(`Writing file ${filename}`);
	frameNum++
	fs.writeFileSync(filename, encoded.packets[0].data);
});
```

### Parameters

* `encoder` : parameter for a [beamcoder encoder](https://github.com/Streampunk/beamcoder#encoder) , if `null` the beamcoder [frame](https://github.com/Streampunk/beamcoder#creating-frames) will be streamed
* `fps` : the fps of the stream, in case you face an error like `[mjpeg @ 0x43550c0] Invalid pts (1646229470965) <= last (1646229470990)` you might want to increase your fps to avoid collision between block's fps 
* `keyframeOnly` : if `true` only stream the keyframes, this is a safe way to use this library

### Output

* `encoded` : encoded packets see [beamcoder packets](https://github.com/Streampunk/beamcoder#creating-packets)
* `frame` : raw beamcoder [frame](https://github.com/Streampunk/beamcoder#creating-frames)
* `tags` : [Kinesis video Stream mkv tags](https://docs.aws.amazon.com/kinesisvideostreams/latest/dg/API_dataplane_GetMedia.html#API_dataplane_GetMedia_ResponseSyntax) 
