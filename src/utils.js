const { spawnSync } = require('child_process');
const chalk = require('chalk');
const { getBackendConfig } = require('./config');

/**
 * Check if a command exists in the system PATH
 * @param {string} command Command to check
 * @returns {boolean} True if command exists, false otherwise
 */
function commandExists(command) {
  const checkCmd = process.platform === 'win32' ? 'where' : 'which';
  const result = spawnSync(checkCmd, [command], { stdio: 'ignore' });
  return result.status === 0;
}

/**
 * List of supported backend CLI tools
 */
const SUPPORTED_BACKENDS = {
  'openai': {
    package: '@openai/api',
    command: 'openai',
    installCmd: 'npm install -g openai',
    description: 'OpenAI official CLI',
    defaultArgs: ['api', 'completions', 'create']
  },
  'gpt': {
    package: 'gpt3-cli',
    command: 'gpt',
    installCmd: 'npm install -g gpt3-cli',
    description: 'GPT CLI tool',
    defaultArgs: []
  },
  'anthropic': {
    package: '@anthropic-ai/sdk',
    command: 'anthropic',
    installCmd: 'npm install -g @anthropic-ai/cli',
    description: 'Anthropic CLI tool',
    defaultArgs: ['completions', 'create']
  },
};

/**
 * Check if a backend CLI tool is installed
 * @param {string} backendCmd Command to check
 * @returns {object} Backend info if found, null otherwise
 */
function checkBackend(backendCmd) {
  // Allow for direct selection of a known backend
  if (SUPPORTED_BACKENDS[backendCmd]) {
    const backend = SUPPORTED_BACKENDS[backendCmd];
    if (commandExists(backend.command)) {
      return {
        command: backend.command,
        installed: true,
        info: backend
      };
    }
    return {
      command: backend.command,
      installed: false,
      info: backend
    };
  }
  
  // Or check a custom command
  if (commandExists(backendCmd)) {
    return {
      command: backendCmd,
      installed: true,
      info: {
        description: 'Custom backend',
        defaultArgs: []
      }
    };
  }
  
  return null;
}

/**
 * Try to find any available supported backend
 * @returns {object|null} First available backend or null if none found
 */
function findAnyBackend() {
  for (const [name, info] of Object.entries(SUPPORTED_BACKENDS)) {
    if (commandExists(info.command)) {
      return {
        command: info.command,
        installed: true,
        info
      };
    }
  }
  return null;
}

/**
 * Ensure a backend CLI tool is installed
 * @param {string} [preferredBackend] Preferred backend tool name
 * @returns {object} Backend info object
 */
function ensureBackendInstalled(preferredBackend) {
  // Get backend configuration from settings
  const backendConfig = getBackendConfig();
  const backendToUse = preferredBackend || backendConfig.active;
  
  // First, check if the configured backend is installed
  let backend = null;
  if (backendToUse) {
    backend = checkBackend(backendToUse);
  }
  
  // If not found or not specified, try to find any supported backend
  if (!backend || !backend.installed) {
    backend = findAnyBackend();
  }
  
  // If the backend exists but isn't installed, try to install it
  if (backend && !backend.installed) {
    console.log(chalk.yellow(`${backend.command} CLI not found. Installing ${backend.info.package} globally...`));
    
    const install = spawnSync('npm', ['install', '-g', backend.info.package], { 
      stdio: 'inherit',
      shell: true
    });
    
    if (install.status === 0) {
      console.log(chalk.green(`${backend.command} CLI installed successfully.`));
      backend.installed = true;
    } else {
      console.error(chalk.red(`Failed to install ${backend.command} CLI.`));
    }
  }
  
  // If still not found, suggest manual installation
  if (!backend || !backend.installed) {
    console.error(chalk.red('No supported backend CLI tools found.'));
    console.log(chalk.yellow('Please install one of the following:'));
    
    Object.entries(SUPPORTED_BACKENDS).forEach(([name, info]) => {
      console.log(chalk.cyan(`- ${name}: ${info.description}`));
      console.log(`  Install with: ${info.installCmd}`);
    });
    
    console.log(chalk.yellow('\nThen configure it with:'));
    console.log(chalk.cyan('cw backend set <backend-name>'));
    
    process.exit(1);
  }
  
  return backend;
}

/**
 * Generate command arguments for a specific provider and model
 * @param {string} provider Provider name
 * @param {string} model Model name
 * @param {Array} extraArgs Additional arguments
 * @param {object} backend Backend information
 * @returns {Array} Command arguments
 */
function generateCommandArgs(provider, model, extraArgs, backend) {
  // Start with the default arguments for the backend
  const args = [...(backend.info.defaultArgs || [])];
  
  // Different backends have different ways to specify provider and model
  switch (backend.command) {
    case 'openai':
      args.push('--model', model);
      break;
    case 'gpt':
      args.push('--engine', model);
      break;
    case 'anthropic':
      args.push('--model', model);
      break;
    default:
      // For custom backends, we append provider and model flags generically
      args.push('--provider', provider, '--model', model);
  }
  
  // Add any extra arguments
  if (extraArgs && extraArgs.length) {
    args.push(...extraArgs);
  }
  
  return args;
}

module.exports = {
  ensureBackendInstalled,
  generateCommandArgs,
  SUPPORTED_BACKENDS
};