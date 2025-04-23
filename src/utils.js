const { spawnSync } = require('child_process');
const chalk = require('chalk');

/**
 * Ensure the codex CLI is installed
 */
function ensureCodexInstalled() {
  const which = spawnSync('which', ['codex'], { stdio: 'ignore' });
  
  if (which.status !== 0) {
    console.log(chalk.yellow('Codex CLI not found. Installing @openai/codex globally...'));
    
    const install = spawnSync('npm', ['install', '-g', '@openai/codex'], { 
      stdio: 'inherit',
      shell: true
    });
    
    if (install.status !== 0) {
      console.error(chalk.red('Failed to install Codex CLI. Check your permissions and network connection.'));
      process.exit(1);
    }
    
    console.log(chalk.green('Codex CLI installed successfully.'));
  }
}

module.exports = {
  ensureCodexInstalled
};