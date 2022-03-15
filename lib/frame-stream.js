const { Transform } = require('stream');
const KvsStream = require('./kvs-stream.js');
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

        const stream = new KvsStream(getMediaParameters, awsInstances)
        stream.pipe(this);
    }

    _transform(fragment, enc, cb) {
        const tags = {};
        const error = null;

        if (fragment.Children.lenght > 0) {
            for (const fragmentChild of fragment.Children) {
                if (fragmentChild.idName == "Tags") {
                    for (const tagChild of fragmentChild.Children[0].Children) {
                        tags[tagChild[0].data] = tags[tagChild[1].data]
                        cb(error, { tags });
                    }
                }
            }
        }
        cb(error);
    }
}

module.exports = FrameStream;
