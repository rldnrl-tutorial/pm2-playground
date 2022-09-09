module.exports = {
  apps: [
    {
      name: 'frontend',
      script: 'yarn start',
      instances: 0,
      exec_mode: 'cluster'
    }
  ]
}
