const {Transform} = require('stream');
const Buffer = require('buffer').Buffer;
const beamcoder = require('beamcoder');
const FragmentStream = require('./fragment-stream.js');
const defaultLogger = require('./default-logger');

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
    const { logger= defaultLogger} = awsInstances
    this.logger = logger;
		const stream = new FragmentStream(getMediaParameters, awsInstances);
		stream.pipe(this);
	}

	_transform(fragment, enc, cb) {
    this.logger.debug("FrameStream: Transforming fragment", fragment.cluster.blocks.length)
		const {cluster, tracks} = fragment;
		const decoder = beamcoder.decoder({name: 'h264', width: 1920, height: 1080});
		decoder.extradata = tracks[0].CodecPrivate;
		const promises = [];

		const {timecode, blocks} = cluster;
		const framesPromise = this.decodeFrames({timecode, blocks, decoder}).then(frames => {
      this.logger.debug(`${frames.length} Frames decoded`)
      for(const frame of frames){
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

	decodeFrames({timecode, blocks, decoder, trackId = 1, fps = 25}) {
    this.logger.debug(`Decoding ${blocks.length} blocks`)
    // const data = Buffer.concat(blocks.map(b => b.payload))
    // const packet = beamcoder.packet({
    //   pts: timecode, 
    //   dts: timecode, 
    //   data: data, 
    //   stream_index: 0, 
    //   size: Buffer.byteLength(data)
    // });
    // console.log("normal", blocks)
    // 
    // return decoder.decode(packet).then(decResult => {
		// 	if (decResult.frames.length === 0) {
    //     console.log("emty", blocks)
		// 		throw new Error(`No Frames detected`);
		// 	} else {
    //     this.logger.debug(`${decResult.frames.length} frames decoded`)
		// 		return decResult.frames;
		// 	}
		// })
    
    const recursiveDecode = (index = 0, prevDecodedFrames = []) => {
      if(index >= blocks.length){
        return prevDecodedFrames
      }
      if(trackId !== blocks[index].track){
        return recursiveDecode(index+1, prevDecodedFrames)
      }
      const pts = timecode + index / fps * 1000;
      const packet = beamcoder.packet({
        pts, 
        data: blocks[index].payload, 
        stream_index: 0, 
        size: Buffer.byteLength(blocks[index].payload)
      });
    
      return decoder.decode(packet).then(decResult => {
  			if (decResult.frames.length === 0) {
  				throw new Error(`No Frames detected in block ${index}/${blocks.length}`);
  			} else {
          // this.logger.debug(`${decResult.frames.length} frames decoded in block ${index}`)
  				return decResult.frames;
  			}
  		}).then(decodedFrames => {
        const allDecodedFrames = prevDecodedFrames.concat(decodedFrames);
        return recursiveDecode(index+1, allDecodedFrames);
      })
    }
    
    return recursiveDecode()
	}
}

module.exports = FrameStream;
