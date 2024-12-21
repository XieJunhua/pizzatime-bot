module.exports = {
  apps: [
    {
      name: "pizzatime-bot",
      script: "bun",
      args: "src/index.ts",
      watch: true,
      // 如果需要在崩溃时自动重启
      autorestart: true,
      // 设置环境变量
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
