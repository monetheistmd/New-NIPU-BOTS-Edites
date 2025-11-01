module.exports = {
  apps: [
    {
      name: "money-heist-md",
      script: "index.js",
      watch: false,
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
