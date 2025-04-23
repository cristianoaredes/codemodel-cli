#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const inquirer = require('inquirer');
const { loadConfig, saveConfig, setActiveBackend, getBackendConfig } = require('../src/config');
const { ensureBackendInstalled, generateCommandArgs, SUPPORTED_BACKENDS } = require('../src/utils');
const { spawnSync } = require('child_process');

const program = new Command();

program
  .name('cw')
  .description('CLI wrapper for AI code models')
  .version('0.1.0');

// List profiles
program
  .command('list')
  .description('List available profiles')
  .action(() => {
    const config = loadConfig();
    console.log(chalk.bold('Available profiles:'));
    if (Object.keys(config.profiles).length === 0) {
      console.log(chalk.yellow('  No profiles defined. Use `cw add <name>` to add a new profile.'));
      return;
    }
    
    Object.keys(config.profiles).forEach(name => {
      const p = config.profiles[name];
      const mark = config.active === name ? chalk.green('*') : ' ';
      console.log(`${mark} ${chalk.cyan(name)}: provider=${chalk.yellow(p.provider)}, model=${chalk.yellow(p.model)}`);
    });
  });

// Add/update profile
program
  .command('add')
  .description('Add or update a profile')
  .argument('<name>', 'Profile name')
  .option('-p, --provider <provider>', 'Provider name')
  .option('-m, --model <model>', 'Model name')
  .option('-i, --interactive', 'Interactive mode')
  .action(async (name, options) => {
    const config = loadConfig();
    
    let provider = options.provider;
    let model = options.model;
    
    if (options.interactive || (!provider || !model)) {
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'provider',
          message: 'Choose a provider:',
          default: config.profiles[name]?.provider || 'openai',
          choices: [
            { name: 'OpenAI', value: 'openai' },
            { name: 'Google Gemini', value: 'gemini' },
            { name: 'Anthropic', value: 'anthropic' },
            { name: 'DeepSeek', value: 'deepseek' },
            { name: 'Mistral AI', value: 'mistral' },
            { name: 'Qwen', value: 'qwen' },
            { name: 'OpenRouter', value: 'openrouter' },
            { name: 'Other (specify)', value: 'other' }
          ]
        },
        {
          type: 'input',
          name: 'customProvider',
          message: 'Enter provider name:',
          when: (answers) => answers.provider === 'other'
        },
        {
          type: 'input',
          name: 'model',
          message: 'Enter model name:',
          default: config.profiles[name]?.model || '',
          validate: (input) => input.trim() !== '' ? true : 'Model name cannot be empty'
        }
      ]);
      
      provider = answers.provider === 'other' ? answers.customProvider : answers.provider;
      model = answers.model;
    }
    
    if (!provider || !model) {
      console.error(chalk.red('Error: Both --provider and --model must be specified'));
      process.exit(1);
    }
    
    config.profiles[name] = { provider, model };
    if (!config.active) config.active = name;
    saveConfig(config);
    console.log(chalk.green(`Profile '${name}' added/updated.`));
  });

// Remove profile
program
  .command('remove')
  .alias('rm')
  .description('Remove a profile')
  .argument('<name>', 'Profile name')
  .action((name) => {
    const config = loadConfig();
    if (!config.profiles[name]) {
      console.error(chalk.red(`Profile '${name}' does not exist.`));
      process.exit(1);
    }
    
    delete config.profiles[name];
    if (config.active === name) {
      config.active = Object.keys(config.profiles)[0] || null;
    }
    
    saveConfig(config);
    console.log(chalk.green(`Profile '${name}' removed.`));
  });

// Select profile
program
  .command('use')
  .description('Set active profile')
  .argument('<name>', 'Profile name')
  .action((name) => {
    const config = loadConfig();
    if (!config.profiles[name]) {
      console.error(chalk.red(`Profile '${name}' does not exist.`));
      process.exit(1);
    }
    
    config.active = name;
    saveConfig(config);
    console.log(chalk.green(`Active profile: '${name}'.`));
  });

// Interactive selection
program
  .command('select')
  .description('Interactively select a profile')
  .action(async () => {
    const config = loadConfig();
    if (Object.keys(config.profiles).length === 0) {
      console.log(chalk.yellow('No profiles defined. Use `cw add <name>` to add a new profile.'));
      return;
    }
    
    const { selected } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selected',
        message: 'Select active profile:',
        choices: Object.keys(config.profiles).map(name => ({
          name: `${name} (${config.profiles[name].provider}/${config.profiles[name].model})`,
          value: name
        }))
      }
    ]);
    
    config.active = selected;
    saveConfig(config);
    console.log(chalk.green(`Active profile: '${selected}'.`));
  });

// Backend management commands
program
  .command('backend')
  .description('Manage backend CLI tools')
  .argument('<cmd>', 'Backend command: list, set, info, install')
  .argument('[value]', 'Backend name for set and install commands')
  .action((cmd, value) => {
    if (cmd === 'list') {
      console.log(chalk.bold('Available backends:'));
      
      Object.entries(SUPPORTED_BACKENDS).forEach(([name, info]) => {
        const backendInfo = checkBackend(name);
        const status = backendInfo && backendInfo.installed ? chalk.green('✓ Installed') : chalk.yellow('✗ Not installed');
        console.log(`${chalk.cyan(name)}: ${info.description} ${status}`);
        console.log(`  Command: ${info.command}`);
        console.log(`  Install: ${info.installCmd}`);
      });
      
      const config = loadConfig();
      if (config.backend && config.backend.active) {
        console.log(chalk.bold(`\nActive backend: ${chalk.green(config.backend.active)}`));
      }
      
      return;
    }
    
    if (cmd === 'set') {
      if (!value) {
        console.error(chalk.red('Error: Backend name is required for "set" command'));
        process.exit(1);
      }
      
      // Check if it's a supported backend
      if (!SUPPORTED_BACKENDS[value] && value !== 'custom') {
        console.error(chalk.red(`Unknown backend: ${value}`));
        console.log(chalk.yellow('Available backends:'), Object.keys(SUPPORTED_BACKENDS).join(', '));
        process.exit(1);
      }
      
      // Set the active backend
      setActiveBackend(value);
      console.log(chalk.green(`Active backend set to: ${value}`));
      return;
    }
    
    if (cmd === 'info') {
      const backend = ensureBackendInstalled();
      console.log(chalk.bold('Current backend information:'));
      console.log(`Command: ${chalk.cyan(backend.command)}`);
      console.log(`Description: ${backend.info.description}`);
      console.log(`Default args: ${backend.info.defaultArgs.join(' ')}`);
      return;
    }
    
    if (cmd === 'install') {
      if (!value) {
        console.error(chalk.red('Error: Backend name is required for "install" command'));
        process.exit(1);
      }
      
      if (!SUPPORTED_BACKENDS[value]) {
        console.error(chalk.red(`Unknown backend: ${value}`));
        console.log(chalk.yellow('Available backends:'), Object.keys(SUPPORTED_BACKENDS).join(', '));
        process.exit(1);
      }
      
      const backend = SUPPORTED_BACKENDS[value];
      console.log(chalk.yellow(`Installing ${value} backend (${backend.package})...`));
      
      const install = spawnSync('npm', ['install', '-g', backend.package], { 
        stdio: 'inherit',
        shell: true
      });
      
      if (install.status === 0) {
        console.log(chalk.green(`${value} backend installed successfully.`));
        setActiveBackend(value);
        console.log(chalk.green(`Active backend set to: ${value}`));
      } else {
        console.error(chalk.red(`Failed to install ${value} backend.`));
        process.exit(1);
      }
      
      return;
    }
    
    console.error(chalk.red(`Unknown backend command: ${cmd}`));
    console.log(chalk.yellow('Available commands: list, set, info, install'));
  });

// Run with profile
program
  .command('run')
  .description('Run commands with the active profile')
  .allowUnknownOption(true)
  .option('-p, --profile <name>', 'Profile to use')
  .option('-b, --backend <name>', 'Backend to use for this command')
  .action((options) => {
    const config = loadConfig();
    const name = options.profile || config.active;
    
    if (!name || !config.profiles[name]) {
      console.error(chalk.red('No active profile selected. Use `cw use <name>` to select a profile.'));
      process.exit(1);
    }
    
    const prof = config.profiles[name];
    console.log(chalk.blue(`Using profile: ${name} (${prof.provider}/${prof.model})`));
    
    // Ensure the backend CLI is installed
    const backend = ensureBackendInstalled(options.backend);
    console.log(chalk.blue(`Using backend: ${backend.command}`));
    
    // Get extra arguments and filter out our own options
    const extra = process.argv.slice(process.argv.indexOf('run') + 1)
      .filter(arg => arg !== '-p' && arg !== '--profile' && arg !== options.profile &&
                     arg !== '-b' && arg !== '--backend' && arg !== options.backend);
    
    // Generate backend-specific command arguments
    const args = generateCommandArgs(prof.provider, prof.model, extra, backend);
    
    // Run the command
    const res = spawnSync(backend.command, args, { stdio: 'inherit' });
    process.exit(res.status || 0);
  });

// Default command - if just 'cw' is run with arguments but no subcommand, treat as a prompt
program
  .arguments('[prompt...]')
  .action((promptArgs) => {
    if (promptArgs && promptArgs.length > 0) {
      // If we have arguments, treat them as a prompt
      const prompt = promptArgs.join(' ');
      
      const config = loadConfig();
      if (!config.active) {
        console.log(chalk.yellow('No active profile selected. Use `cw use <name>` or `cw select` to select a profile.'));
        process.exit(1);
      }
      
      // Call the run command with the prompt
      const runCmd = program.commands.find(cmd => cmd.name() === 'run');
      process.argv = [process.argv[0], process.argv[1], 'run', prompt];
      runCmd.action({ profile: config.active });
    } else {
      // If no arguments, check if we have an active profile and show help
      const config = loadConfig();
      if (!config.active) {
        console.log(chalk.yellow('No active profile selected. Use `cw use <name>` or `cw select` to select a profile.'));
      } else {
        console.log(chalk.blue(`Active profile: ${config.active}`));
        console.log(chalk.yellow('Use `cw "your prompt"` to send a prompt with the active profile.'));
      }
      
      program.help();
    }
  });

program.parse(process.argv);

// Helper function to check if a backend is installed
function checkBackend(backendName) {
  try {
    const info = SUPPORTED_BACKENDS[backendName];
    if (!info) return null;
    
    const checkCmd = process.platform === 'win32' ? 'where' : 'which';
    const result = spawnSync(checkCmd, [info.command], { stdio: 'ignore' });
    
    return {
      command: info.command,
      installed: result.status === 0,
      info
    };
  } catch (err) {
    return { installed: false };
  }
}
