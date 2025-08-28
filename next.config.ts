import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable experimental features for better performance
  experimental: {
    // Optimize CSS processing
    optimizeCss: true,
    // Enable parallel compilation
    webpackBuildWorker: true,
    // Reduce bundle size
    optimizePackageImports: [
      "@firebase/app",
      "@firebase/auth",
      "@firebase/firestore",
      "@vapi-ai/web",
      "react",
      "next",
    ],
    // Enable faster builds with turbo
    turbo: {
      rules: {
        "*.svg": {
          loaders: ["@svgr/webpack"],
          as: "*.js",
        },
      },
    },
  },

  // Enable compression for faster responses
  compress: true,

  // Optimize images for faster loading
  images: {
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Add remote patterns to allow external image sources
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.jsdelivr.net",
        port: "",
        pathname: "/gh/devicons/devicon/**",
      },
    ],
  },

  // Keep your existing build configurations
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Webpack optimizations for faster builds
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimize bundle splitting for better loading
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: "all",
        minSize: 20000,
        minRemainingSize: 0,
        minChunks: 1,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        enforceSizeThreshold: 50000,
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          firebase: {
            test: /[\\/]node_modules[\\/](@firebase|firebase)[\\/]/,
            name: "firebase",
            chunks: "all",
            priority: 10,
            enforce: true,
          },
          vapi: {
            test: /[\\/]node_modules[\\/]@vapi-ai[\\/]/,
            name: "vapi",
            chunks: "all",
            priority: 9,
            enforce: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            chunks: "all",
            priority: 5,
            minChunks: 2,
          },
        },
      },
    };

    // Faster builds in development
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ["**/node_modules", "**/.next"],
      };

      // Reduce memory usage
      config.optimization.removeAvailableModules = false;
      config.optimization.removeEmptyChunks = false;
      config.optimization.splitChunks = false;
    }

    // Add bundle analyzer if needed
    if (process.env.ANALYZE === "true") {
      const BundleAnalyzerPlugin = require("@next/bundle-analyzer")();
      config.plugins.push(new BundleAnalyzerPlugin());
    }

    return config;
  },

  // *** REMOVED: output: "standalone", *** - This was causing the 502 error

  // Reduce overhead
  poweredByHeader: false,

  // Enable faster page transitions
  reactStrictMode: true,
};

export default nextConfig;
