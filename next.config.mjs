const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/mbti',
        destination: '/whisper',
        permanent: false,
      },
      {
        source: '/coupons',
        destination: '/talkcards',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
