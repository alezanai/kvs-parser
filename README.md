# Kinesis Video Stream Parser Library in Node.js

Unofficial Node.js (Kinesis Video Stream)[https://aws.amazon.com/kinesis/video-streams/] Parser Library, provided without any warranty, and not by AWS.

This library is using 
* (ebml-stream)[https://www.npmjs.com/package/ebml-stream]
* (beamcoder)[https://www.npmjs.com/package/beamcoder]

Because it uses (beamcoder)[https://www.npmjs.com/package/beamcoder], in order to use it, you need to have ffmpeg on your system, see [beamcoder installation instructions](https://github.com/Streampunk/beamcoder#installation) for the detailed steps about how to set up ffmpeg lib.

## Context

* The existing parser library is [in Java](https://docs.aws.amazon.com/kinesisvideostreams/latest/dg/parser-library.html)
* The existing [getMedia](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/KinesisVideoMedia.html#getMedia-property) is a little bit [tricky](https://stackoverflow.com/questions/53921074/how-to-get-metadata-from-amazon-kinesis-video-streams-via-video-js-and-http-stre/71298009#71298009) to use.

## Features

* KvsStream : stream the parsed, but not decoded Kvs raw information
* IFrameStream : stream all the frames in the video stream

## Usage

### KvsStream

```js

const {KvsStream} = require('kvs-parser');

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
}

const stream = new KvsStream(getMediaParams)

stream.on('data', {tags, encoded} => {
	// tags contains 
	tags['AWS_KINESISVIDEO_CONTINUATION_TOKEN']
	tags['AWS_KINESISVIDEO_MILLIS_BEHIND_NOW']
	tags['AWS_KINESISVIDEO_FRAGMENT_NUMBER']
	tags['AWS_KINESISVIDEO_SERVER_TIMESTAMP']
	tags['AWS_KINESISVIDEO_PRODUCER_TIMESTAMP']
	tags['AWS_KINESISVIDEO_ERROR_CODE']
	tags['AWS_KINESISVIDEO_ERROR_ID']
	
	// encoded is a buffer
})

```


### FragmentStream

FragmentStream is decoding the fragments from kvs video stream.

```js

const {FragmentStream} = require('kvs-parser');

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

const decodingParams = {
	onlyKeyframes: true
};

const stream = new FragmentStream(getMediaParams, decodingParams)

stream.on('data', {tags, frame} => {
	// tags contains 
	tags['AWS_KINESISVIDEO_CONTINUATION_TOKEN']
	tags['AWS_KINESISVIDEO_MILLIS_BEHIND_NOW']
	tags['AWS_KINESISVIDEO_FRAGMENT_NUMBER']
	tags['AWS_KINESISVIDEO_SERVER_TIMESTAMP']
	tags['AWS_KINESISVIDEO_PRODUCER_TIMESTAMP']
	tags['AWS_KINESISVIDEO_ERROR_CODE']
	tags['AWS_KINESISVIDEO_ERROR_ID']
	
	// frame is a beamcoder frame see https://github.com/Streampunk/beamcoder#creating-frames
	console.log(frame);
});
```

### IFrameStream

IFrameStream is decoding the fragments and then extract frame for each fragment

```js

const {IFrameStream} = require('kvs-parser');

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

const decodingParams = {
	onlyKeyframes: true
};

const stream = new IFrameStream(getMediaParams, {
	kinesisvideo,
	kinesisvideomedia,
	encoder: 'mjpeg'
})

stream.on('data', frame => {
	// frame is a beamcoder frame see https://github.com/Streampunk/beamcoder#creating-frames
	console.log(frame);
});
```
