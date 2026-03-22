module.exports = {
  apps: [
    {
      name: "backend",
      cwd: "./backend",
      script: "make",
      args: "prod",
      interpreter: "none",
      env_file: "./backend/.env",
      autorestart: true,
      watch: false,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
    {
      name: "frontend",
      cwd: "./frontend",
      script: "npm",
      args: "run start",
      interpreter: "none",
      env_file: "./frontend/.env",
      autorestart: true,
      watch: false,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
