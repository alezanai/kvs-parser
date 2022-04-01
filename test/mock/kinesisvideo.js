const kinesisvideo = {
	getDataEndpoint() {
		return {
			promise() {
				return Promise.resolve(
					{
						data: {
							DataEndpoint: 'https://fakeurl',
						},
					});
			},
		};
	},
};

module.exports = kinesisvideo;
