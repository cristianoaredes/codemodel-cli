#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const inquirer = require('inquirer');
const { loadConfig, saveConfig } = require('../src/config');
const { ensureCodexInstalled } = require('../src/utils');
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

// Run with profile
program
  .command('run')
  .description('Run codex with the active profile')
  .allowUnknownOption(true)
  .option('-p, --profile <name>', 'Profile to use')
  .action((options) => {
    const config = loadConfig();
    const name = options.profile || config.active;
    
    if (!name || !config.profiles[name]) {
      console.error(chalk.red('No active profile selected. Use `cw use <name>` to select a profile.'));
      process.exit(1);
    }
    
    const prof = config.profiles[name];
    console.log(chalk.blue(`Using profile: ${name} (${prof.provider}/${prof.model})`));
    
    const extra = process.argv.slice(process.argv.indexOf('run') + 1)
      .filter(arg => arg !== '-p' && arg !== '--profile' && arg !== options.profile);
    
    const args = ['--provider', prof.provider, '--model', prof.model].concat(extra);
    
    // Ensure the codex CLI is installed
    ensureCodexInstalled();
    
    // Run the command
    const res = spawnSync('codex', args, { stdio: 'inherit' });
    process.exit(res.status || 0);
  });

// Default command - if just 'cw' is run without subcommand, execute 'run'
program
  .action(() => {
    const config = loadConfig();
    if (!config.active) {
      console.log(chalk.yellow('No active profile selected. Use `cw use <name>` or `cw select` to select a profile.'));
      process.exit(1);
    }
    
    // Call the run command with no additional arguments
    program.commands.find(cmd => cmd.name() === 'run').action({ profile: config.active });
  });

program.parse(process.argv);