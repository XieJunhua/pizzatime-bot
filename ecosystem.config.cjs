module.exports = {
  apps: [
    {
      name: "pizzatime-bot",
      script: "bun",
      args: "run src/index.ts",
      watch: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: "5s",
      env: {
        NODE_ENV: "production",
      },
      error_file: "logs/err.log",
      out_file: "logs/out.log",
    },
  ],
};
