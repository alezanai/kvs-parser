const {Transform} = require('stream');
const {EbmlTagId} = require('ebml-stream');
// Memory of the current video fragment
// should empty itself automatically
const openMainTags = [];

const safeDepthLimit = 100;

const reverseTagId = {};
for (const k of Object.keys(EbmlTagId)) {
	reverseTagId[EbmlTagId[k]] = k;
}

function transform(ebmlTag, enc, cb) {
	const {id, position, type} = ebmlTag;
	const tagTypeName = reverseTagId[id];
	ebmlTag.idName = tagTypeName;

	if (openMainTags.length > safeDepthLimit) {
		return cb(new Error(`openMasterTags reached the limit (${openMainTags.length} > ${safeDepthLimit})`));
	}

	const lastMain = openMainTags[openMainTags.length - 1];
	let error = null;
	let chunk = null;
	if (type === 'm') {
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
				chunk = lastTag;
			}
		} else {
			error = new Error('strange master tag should have position 0 or 2');
		}
	} else if (lastMain) {
		lastMain.Children = lastMain.Children.concat([ebmlTag]);
		// Console.log(new Array(openMasterTags.length).fill('-').join(''), 'Opening EBML TAG', ebmlTag.id, tagTypeName,ebmlTag.data);
	} else {
		chunk = ebmlTag;
		// Console.log(new Array(openMasterTags.length).fill('-').join(''),'Root EBML TAG', ebmlTag.id, ebmlTag.type, tagTypeName);
		// err = new Error(`root element should always be a master tag ${type}-${id}-${position} `);
	}

	cb(error, chunk);
}

module.exports = new Transform({
	transform,
	readableObjectMode: true,
	writableObjectMode: true,
});
