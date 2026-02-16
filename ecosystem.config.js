module.exports = {
  apps: [{
    name: 'ivcf-api',
    script: 'dist/main.js',
    cwd: '/var/www/ivcf-api',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'development',
      PORT: 3333,
    },            
    error_file: '/var/log/pm2/ivcf-api.err.log',
    out_file: '/var/log/pm2/ivcf-api.out.log',
    time: true,
    max_memory_restart: '512M',
    node_args: '--max-old-space-size=1024',
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'dist'],
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
}