/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@aws-sdk/client-s3", "@aws-sdk/s3-request-presigner"],
  },
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: "canvas" }];
    return config;
  },
};

export default nextConfig;
