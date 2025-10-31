module.exports = {
  apps: [
    {
      name: "money-heist-bot",
      script: "index.js",
      watch: false,
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
