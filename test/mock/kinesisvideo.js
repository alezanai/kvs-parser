const AWS = require('aws-sdk');

const kinesisvideo = new AWS.KinesisVideo();

module.exports = { kinesisvideo }