const {Transform} = require('stream');
const AWS = require('aws-sdk');
const {EbmlStreamDecoder, EbmlTagId} = require('ebml-stream');

// Memory of the current video fragment
// should empty itself automatically

const safeDepthLimit = 100;

const reverseTagId = {};
for (const k of Object.keys(EbmlTagId)) {
	reverseTagId[EbmlTagId[k]] = k;
}

/**
 * KvsStream parse the AWS Kinesis video stream.
 * This class uses the (ebml-stream)[https://www.npmjs.com/package/ebml-stream] library to parse the MKV Information
*/
class KvsStream extends Transform {
	/**
	 * Constructor will getMediaParams and awsInstances as Input.
	 * @throws Will throw an error if the getMediaParams is null.
	 * @param {object} getMediaParameters - params - Parameters to how you want to retrive the  Kiensis video stream
	 * @param {object = null} awsInstances - aws instances - used to mock AWS services for local testing
	 * @example
	 * new KvsStream({ StartSelector: { StartSelectorType: 'FRAGMENT_NUMBER | SERVER_TIMESTAMP | PRODUCER_TIMESTAMP | NOW | EARLIEST | CONTINUATION_TOKEN'}, StreamName: streamName.})
	*/
	constructor(getMediaParameters, awsInstances = {}) {
		// Memory used to list the number of open main tags in the stream


		super({
			readableObjectMode: true,
			writableObjectMode: true,
		});
		
		this.memory = {
			openMainTags: []
		};
		
		this.connectToKvs(getMediaParameters, awsInstances);
	}
	
	_transform(ebmlTag, enc, cb){
		const {openMainTags, lastClusterTag, lastEBMLTag} = this.memory
		if(Array.isArray(lastEBMLTag)){
			throw(new Error('shoulnd never be an array'))
		}
		const {id, position, type} = ebmlTag;
		const tagTypeName = reverseTagId[id];
		ebmlTag.idName = tagTypeName;

		if (openMainTags.length > safeDepthLimit) {
			return cb(new Error(`openMasterTags reached the limit (${openMainTags.length} > ${safeDepthLimit})`));
		}
		

		const lastMain = openMainTags[openMainTags.length - 1];
		let error = null;
		if(!lastEBMLTag && tagTypeName !== 'EBML'){
			return cb()
		}
		if (type === 'm') {
			if(lastClusterTag){
				lastEBMLTag.Children = lastEBMLTag.Children.concat([lastClusterTag]);
			}
			delete this.memory.lastClusterTag;
			// Opening of a new tag
			if (position === 0) {
				// Console.log(new Array(openMasterTags.length).fill('-').join(''), 'Opening EBML TAG', ebmlTag.id);
				// Add this tag as a child of his parent
				if (lastMain) {
					lastMain.Children = lastMain.Children.concat([ebmlTag]);
				}

				// Then add this master tag as the last open Master tag
				openMainTags.push(ebmlTag);
			} else if (position === 2) { // Closing of a new tag
				const lastTag = openMainTags.splice(-1)[0];
				// Console.log(new Array(openMasterTags.length).fill('-').join(''),'Closing EBML TAG', ebmlTag.id);
				if (lastTag.id !== id) {
					error = new Error(`tags do not match when closing the master tag (${id} vs ${lastTag.id})`);
				}

				if (openMainTags.length === 0) {
					// Console.log('Root tag found', ebmlTag.id);
					if(tagTypeName === 'Cluster'){
						this.memory.lastClusterTag = lastTag;
					} else if(tagTypeName !== 'EBML') {
						lastEBMLTag.Children = lastEBMLTag.Children.concat([lastTag]);
					} else if(tagTypeName === 'EBML') {
						if(lastEBMLTag){
							this.push(lastEBMLTag);
						}
						this.memory.lastEBMLTag = ebmlTag;
					}
				}
			} else {
				error = new Error('strange master tag should have position 0 or 2');
			}
		} else if (lastMain) {
			lastMain.Children = lastMain.Children.concat([ebmlTag]);
			// Console.log(new Array(openMasterTags.length).fill('-').join(''), 'Opening EBML TAG', ebmlTag.id, tagTypeName,ebmlTag.data);
		} else {
			if(lastClusterTag){
				lastClusterTag.Children = lastClusterTag.Children.concat([ebmlTag]);
			} else {
				throw(new Error(`lastClusterTag is null when trying to use non-master as root`))
			}
			// Console.log(new Array(openMasterTags.length).fill('-').join(''),'Root EBML TAG', ebmlTag.id, ebmlTag.type, tagTypeName);
			// err = new Error(`root element should always be a master tag ${type}-${id}-${position} `);
		}
		cb(error);
	}

	connectToKvs(getMediaParameters, awsInstances) {
		const kinesisvideo = awsInstances.kinesisvideo || new AWS.KinesisVideo();
		const kinesisvideomedia = awsInstances.kinesisvideomedia || new AWS.KinesisVideoMedia();
		return kinesisvideo.getDataEndPoint().promise().then(({DataEndPoint}) => {
			kinesisvideomedia.endpoint = DataEndPoint;
			const request = kinesisvideomedia.getMedia(getMediaParameters);
			const requestStream = request.createReadStream();

			const ebmlDecoder = new EbmlStreamDecoder();
			const decodedStream = requestStream.pipe(ebmlDecoder);

			decodedStream.pipe(this);
		});
	}
}
module.exports = KvsStream;
