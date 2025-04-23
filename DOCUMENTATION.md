# CodeModel CLI - Documentation

## Table of Contents

- [Introduction](#introduction)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Command Reference](#command-reference)
- [Provider Models](#provider-models)
- [Development Guide](#development-guide)
- [Building and Distribution](#building-and-distribution)
- [Advanced Usage](#advanced-usage)
- [Troubleshooting](#troubleshooting)

## Introduction

CodeModel CLI (`cw`) is a command-line wrapper tool designed to simplify the management and use of AI code models from different providers. By creating profiles for different provider/model combinations, users can easily switch between models and maintain consistent interfaces while delegating the actual execution to the underlying AI providers.

### Problem Solved

- **Fragmented Interfaces**: Different AI providers have different CLIs and APIs
- **Credential Management**: Need to manage multiple API keys and settings
- **Workflow Disruption**: Switching between different providers interrupts development flow
- **Configuration Overhead**: Reconfiguring tools for different models takes time

### Benefits

- **Unified Interface**: One command for all AI models
- **Profile Switching**: Easily change between models without reconfiguring
- **Enhanced Productivity**: Focus on coding, not on tool configuration
- **Provider Flexibility**: Experiment with different providers without friction

## Architecture

CodeModel CLI uses a simple architecture with the following components:

```
codemodel-cli/
├── bin/
│   └── codemodel.js     # Main CLI entry point
├── src/
│   ├── config.js        # Configuration management
│   └── utils.js         # Utility functions and backend support
├── scripts/
│   ├── create-dmg.sh    # DMG creation script
│   └── setup-profiles.sh # Configures default profiles
└── package.json        # Project metadata
```

### Dependency Structure

- **commander**: Command-line interface framework
- **inquirer**: Interactive prompts for CLI
- **js-yaml**: YAML parsing for configuration files
- **chalk**: Terminal text styling

### Backend Integration

CodeModel CLI doesn't directly interact with AI providers. Instead, it uses various backend CLI tools that are specialized for different providers:

1. **OpenAI CLI** (`openai`): The official OpenAI command-line tool
2. **GPT CLI** (`gpt`): A command-line interface for GPT models
3. **Anthropic CLI** (`anthropic`): Command-line interface for Claude models

The tool can automatically detect and install these backend CLIs as needed, based on the provider being used. This architecture allows for:

- **Flexibility**: Easy support for new providers and models
- **Specializion**: Each backend can optimize for its specific provider
- **Compatibility**: Works with existing credentials and configurations

### Workflow

1. User executes a `cw` command
2. CLI loads configuration from `~/.codemodel-cli/config.yaml`
3. Command is processed (list profiles, add profile, run with profile, etc.)
4. For `run` commands:
   - The appropriate backend CLI is selected and installed if needed
   - Provider/model parameters are translated to backend-specific arguments
   - The command is executed using the chosen backend

## Backend CLI Tools

### Supported Backends

CodeModel CLI supports multiple backend CLI tools, each specializing in different AI providers:

| Backend | Description | Package | Default For |
|---------|-------------|---------|------------|
| openai | OpenAI's official CLI | @openai/api | OpenAI, DeepSeek, Mistral, Qwen, OpenRouter |
| gpt | General-purpose GPT CLI | gpt3-cli | Google Gemini |
| anthropic | Anthropic's CLI for Claude | @anthropic-ai/cli | Anthropic |

### Backend Selection

The backend is selected through the following process:

1. If specified in the command with `--backend`, use that backend
2. If a backend is configured for the active profile, use that
3. Use the default backend for the provider
4. Try to find any available supported backend
5. If no backend is found, guide the user to install one

### Backend Configuration

You can configure backends using the following commands:

```bash
# List available backends
cw backend list

# Set the active backend
cw backend set openai

# View current backend info
cw backend info

# Install a specific backend
cw backend install anthropic
```

### API Keys and Authentication

Each backend CLI has its own authentication system, typically using environment variables:

- **OpenAI**: Requires `OPENAI_API_KEY`
- **Anthropic**: Requires `ANTHROPIC_API_KEY`
- **GPT CLI**: Uses various options depending on configuration

CodeModel CLI does not manage these API keys directly - it relies on the backend CLI's authentication.

## Installation

### Prerequisites

- Node.js v14.0.0 or higher
- npm v6.0.0 or higher

### Installation Methods

#### NPM Global Installation

```bash
npm install -g codemodel-cli
```

#### Manual Installation

```bash
git clone https://github.com/cristianoaredes/codemodel-cli.git
cd codemodel-cli
npm install
npm link
```

#### DMG Installation (macOS)

1. Download the DMG file
2. Open the DMG file
3. Run the `install.sh` script inside the DMG

### Verifying Installation

After installation, verify that the tool is correctly installed:

```bash
cw --version  # Should display the version number
```

## Configuration

### Configuration File

CodeModel CLI stores its configuration in `~/.codemodel-cli/config.yaml` with the following structure:

```yaml
active: default  # The currently active profile
profiles:
  default:
    provider: openai
    model: gpt-4.1
  claude:
    provider: anthropic
    model: claude-3.7-sonnet
  # Additional profiles...
```

### Creating Configuration Manually

You can manually create or edit the configuration file:

```bash
mkdir -p ~/.codemodel-cli
nano ~/.codemodel-cli/config.yaml
```

### Default Configuration

When using `setup-profiles.sh`, the following default profiles are created:

```yaml
active: openai-profile
profiles:
  openai-profile:
    provider: openai
    model: gpt-4.1
  claude-profile:
    provider: anthropic
    model: claude-3.7-sonnet
  deepseek-profile:
    provider: deepseek
    model: deepseek-coder-v3
  openrouter-profile:
    provider: openrouter
    model: agentica-org/deepcoder-14b-preview
```

## Command Reference

### Global Options

- `--version, -V`: Display the version number
- `--help, -h`: Display help information

### Profile Management Commands

#### `cw list`

Lists all available profiles, with the active profile marked.

```bash
cw list
```

Example output:
```
Available profiles:
* openai-profile: provider=openai, model=gpt-4.1
  claude-profile: provider=anthropic, model=claude-3.7-sonnet
  deepseek-profile: provider=deepseek, model=deepseek-coder-v3
  openrouter-profile: provider=openrouter, model=agentica-org/deepcoder-14b-preview
```

#### `cw add <name>`

Adds or updates a profile.

Options:
- `--provider, -p <provider>`: The provider name
- `--model, -m <model>`: The model name
- `--interactive, -i`: Use interactive mode with prompts

```bash
# Add with explicit provider and model
cw add myprofile --provider openai --model gpt-4.1

# Add with interactive prompts
cw add myprofile --interactive
```

#### `cw remove <name>` (alias: `rm`)

Removes a profile.

```bash
cw remove myprofile
```

#### `cw use <name>`

Sets a profile as the active profile.

```bash
cw use myprofile
```

#### `cw select`

Interactively select a profile to set as active.

```bash
cw select
```

#### `cw run [options] [args...]`

Runs a command with the specified or active profile.

Options:
- `--profile, -p <name>`: Profile to use for this command

```bash
# Run with active profile
cw run --help

# Run with specified profile
cw run --profile myprofile --help
```

#### Default Command (Just `cw`)

If no subcommand is specified, the CLI will run with the active profile:

```bash
# Equivalent to 'cw run --help'
cw --help
```

## Provider Models

### OpenAI

- **Default model**: `gpt-4.1`
- **Other options**: 
  - `gpt-4.1`
  - `gpt-4o`
  - `o4-mini`
  - `o3-mini`

### Anthropic

- **Default model**: `claude-3.7-sonnet`
- **Other options**:
  - `claude-3.7-sonnet`
  - `claude-3.5-sonnet`
  - `claude-3-opus`

### DeepSeek

- **Default model**: `deepseek-coder-v3`
- **Other options**:
  - `deepseek-coder-v3`
  - `deepseek-v3`
  - `deepseek-r1`

### Google Gemini

- **Default model**: `gemini-2.5-pro`
- **Other options**:
  - `gemini-2.5-pro`
  - `gemini-2.5-flash`
  - `gemini-2.0-pro`

### Mistral

- **Default model**: `mistral-codestral-2501`
- **Other options**:
  - `mistral-codestral-2501`
  - `mistral-small-3.1`
  - `mistral-large-2`

### Qwen

- **Default model**: `qwen2.5-coder-32b`
- **Other options**:
  - `qwen2.5-coder-32b`
  - `qwen2.5-coder-7b`
  - `qwq-32b` (reasoning model)

### OpenRouter

- **Default model**: `agentica-org/deepcoder-14b-preview`
- **Other options**:
  - `agentica-org/deepcoder-14b-preview` (free)
  - `anthropic/claude-3.7-sonnet-thinking`
  - `qwen/qwen2.5-coder-32b-instruct`
  - `mistralai/codestral-2501`

## Development Guide

### Setting Up Development Environment

```bash
# Clone the repository
git clone https://github.com/yourusername/codemodel-cli.git
cd codemodel-cli

# Install dependencies
npm install

# Link the CLI for development
npm link

# Run tests
npm test
```

### Project Structure

- `bin/`: Contains the main CLI entry point
- `src/`: Contains the source code
- `scripts/`: Contains utility scripts
- `build/`: Temporary build directory
- `dist/`: Distribution files (DMG)

### How to Modify/Extend

#### Adding a New Command

1. In `bin/codemodel.js`, add a new command using the Commander.js API:

```javascript
program
  .command('yourcommand')
  .description('Description of your command')
  .action(() => {
    // Your command logic here
  });
```

#### Adding Support for a New Provider

1. Update the provider list in the interactive mode prompts in `bin/codemodel.js`
2. Add default models for the provider in `src/config.js`

## Building and Distribution

### Building the DMG Installer

```bash
npm run build-dmg
```

This will:
1. Package the application
2. Create the DMG file in the `dist` directory

### DMG Structure

The DMG includes:
- The packaged application (npm package)
- `install.sh` script for easy installation
- README with installation instructions

### Distribution Channels

- GitHub Releases: Upload the DMG and source tarball
- npm Registry: Publish to npm with `npm publish`

## Advanced Usage

### Using with Scripts

You can integrate CodeModel CLI into your scripts:

```bash
#!/bin/bash
# Example script that uses different models for different tasks

# Use OpenAI for code generation
cw use openai-profile
cw "Create a function that calculates fibonacci sequence" > fibonacci.js

# Use Claude for code explanation
cw use claude-profile
cw "Explain the following code:" < fibonacci.js > explanation.md
```

### Customizing Codex Behavior

You can pass additional arguments to the underlying codex CLI:

```bash
# Pass custom parameters
cw run --max-tokens 2000 --temperature 0.7 "Your prompt here"
```

### Environment Variables

CodeModel CLI respects the following environment variables:

- `CODEMODEL_CONFIG_DIR`: Override the default configuration directory
- `CODEMODEL_DEFAULT_PROVIDER`: Set the default provider for new profiles
- `CODEMODEL_DEFAULT_MODEL`: Set the default model for new profiles

Example:
```bash
export CODEMODEL_DEFAULT_PROVIDER=anthropic
export CODEMODEL_DEFAULT_MODEL=claude-3.7-sonnet
cw add newprofile  # Will use the defaults from environment variables
```

## Troubleshooting

### Common Issues

#### Command Not Found

**Problem**: `cw: command not found` after installation.

**Solution**: Ensure the global npm bin directory is in your PATH:
```bash
echo 'export PATH="$(npm bin -g):$PATH"' >> ~/.bashrc
source ~/.bashrc
```

#### Configuration Issues

**Problem**: Changes to profiles don't seem to take effect.

**Solution**: Check the configuration file directly:
```bash
cat ~/.codemodel-cli/config.yaml
```

If necessary, manually edit the file or remove it to start fresh:
```bash
rm ~/.codemodel-cli/config.yaml
```

#### Backend CLI Problems

**Problem**: Errors about no supported backend CLI tools found.

**Solution**: Manually install a supported backend:
```bash
npm install -g openai  # OpenAI CLI
npm install -g gpt3-cli  # GPT CLI
npm install -g @anthropic-ai/cli  # Anthropic CLI
```

Then set it as the active backend:
```bash
cw backend set openai
```

### Getting Help

If you encounter issues not covered in this documentation:

1. Check the [GitHub Issues](https://github.com/cristianoaredes/codemodel-cli/issues) for similar problems
2. Open a new issue if needed, including:
   - The command you ran
   - The error message
   - Your operating system and Node.js version
   - Steps to reproduce

## Credits

CodeModel CLI was created by [Cristiano Aredes](https://github.com/cristianoaredes).

Connect with me on [LinkedIn](https://www.linkedin.com/in/cristianoaredes/).

## License

This project is licensed under the MIT License.
