const path = require('path');

module.exports = {
  sassOptions: {
    includePaths: [path.join(__dirname, 'src', 'styles')],
  },
  eslint: {
    dirs: ['src'],
  },
  images: {
    domains: [
      'res.cloudinary.com',
      'diy-inspect.s3.amazonaws.com',
      'stage-inspex.s3-us-west-2.amazonaws.com',
      'diy-inspect.s3.us-east-1.amazonaws.com',
    ],
  },
  async headers() {
    return [
      {
        // matching all API routes
        // https://vercel.com/guides/how-to-enable-cors
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value:
              'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
          },
        ],
      },
    ];
  },
};
