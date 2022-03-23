const FrameStream = require('../lib/frame-stream.js');
const kinesisvideomedia = require('../test/mock/kinesisvideomedia.js');
const kinesisvideo = require('../test/mock/kinesisvideo.js');

const getMediaParameters = {
  StartSelector: {
    StartSelectorType: 'EARLIEST',
  },
  StreamName: 'test-stream',
};

const stream = new FrameStream(getMediaParameters, {
  kinesisvideomedia,
  kinesisvideo,
});

let count = 0;
stream.on('data', frame => {
  console.log(frame.pts);
  count++;
});


stream.on('end', () => {
  console.log(count);
});

stream.on('error', error => {
  console.log(error);
});
