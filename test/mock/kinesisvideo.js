const kinesisvideo = {
	getDataEndPoint() {
		return {
			promise() {
				return Promise.resolve({
					DataEndPoint: 'https://fakeurl',
				});
			},
		};
	},
};

module.exports = kinesisvideo;
