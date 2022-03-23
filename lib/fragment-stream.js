const {Transform} = require('stream');
const Buffer = require('buffer').Buffer;
const KvsStream = require('./kvs-stream.js');

/**
 * FragmentStream parse the AWS Kinesis video stream.
*/
class FragmentStream extends Transform {
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
		const {logger=console} = awsInstances;
		this.logger = logger;
		const stream = new KvsStream(getMediaParameters, awsInstances);
		stream.pipe(this);
	}

	_transform(fragment, enc, cb) {
		if (fragment.idName === 'Segment') {
			const segmentTags = fragment.Children.filter(a => a.idName === 'Tags');
			const segmentTracks = fragment.Children.filter(a => a.idName === 'Tracks');
			const segmentCluster = fragment.Children.find(a => a.idName === 'Cluster');
			const tags = this.getTags(segmentTags);
			const tracks = this.getTracks(segmentTracks);
			const cluster = this.getCluster(segmentCluster);
			return cb(null, {tags, tracks, cluster});
		}

		cb();

		// Else
	}

	getTags(segmentTags) {
		const tags = {};
		for (const segmentTag of segmentTags) {
			if (segmentTag.Children.length === 1) {
				if (segmentTag.Children[0].Children.length > 0) {
					for (const simpleTag of segmentTag.Children[0].Children) {
						if (simpleTag.Children.length === 2) {
							const tagName = simpleTag.Children[0].data;
							const tagValue = simpleTag.Children[1].data;
							tags[tagName] = tagValue;
						} else {
							throw new Error(`SimpleTag id: ${simpleTag.id} have ${simpleTag.Children.length} Children`);
						}
					}
				} else {
					throw new Error(`Tag id: ${segmentTag.Children[0].id} does not have any Children`);
				}
			} else {
				throw new Error(`SegmentTag id: ${segmentTag.id} does not have any Children`);
			}
		}

		return tags;
	}

	getTracks(segmentTracks) {
		const tracks = [];
		for (const segmentTrack of segmentTracks) {
			if (segmentTrack.Children.length === 1) {
				if (segmentTrack.Children[0].Children.length > 0) {
					const trackEntryObject = {};
					for (const trackEntry of segmentTrack.Children[0].Children) {
						if (trackEntry.idName === 'Video') {
							if (trackEntry.Children.length === 2) {
								const video = {};
								video[trackEntry.Children[0].idName] = trackEntry.Children[0].data;
								video[trackEntry.Children[1].idName] = trackEntry.Children[1].data;
								trackEntryObject[trackEntry.idName] = video;
							} else {
								throw new Error(`Video id: ${trackEntry.id} does not contains PixelHeight or PixelWidth`);
							}
						} else {
							trackEntryObject[trackEntry.idName] = trackEntry.data;
						}
					}

					tracks.push(trackEntryObject);
				} else {
					throw new Error(`Track id: ${segmentTrack.Children[0].id} does not have any Children`);
				}
			} else {
				throw new Error(`SegmentTrack id: ${segmentTrack.id} does not have any Children`);
			}
		}

		return tracks;
	}

	getCluster(segmentCluster) {

			const cluster = {blocks: []};
			for (const clusterChild of segmentCluster.Children) {
				switch (clusterChild.idName) {
					case 'Timecode': {
						cluster.timecode = clusterChild.data;
						break;
					}

					case 'SimpleBlock': {

						cluster.blocks.push(clusterChild) //= cluster.payload ? Buffer.concat([cluster.payload, clusterChild.payload]) : clusterChild.payload;
						break;
					}

					case 'Position': {
						cluster.position = clusterChild.data;
						break;
					}

				}
			}
			this.logger.debug(segmentCluster.Children, cluster.blocks.length)
			return cluster;
	}
}

module.exports = FragmentStream;
