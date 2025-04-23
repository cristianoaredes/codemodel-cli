# CodeModel CLI

<div align="center">
  
[![Version](https://img.shields.io/badge/version-0.1.0-blue)](https://github.com/cristianoaredes/codemodel-cli/releases)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)

**A streamlined CLI wrapper for AI code models**

</div>

## 📋 Overview

CodeModel CLI (`cw`) is a command-line interface wrapper designed to simplify the management and usage of various AI code models from different providers. It allows users to define profiles for different AI providers and models, switch between them seamlessly, and execute commands with the selected profile.

### Key Features

- **Profile Management**: Create, update, and switch between different AI model profiles
- **Multiple Provider Support**: Works with all major AI providers (OpenAI, Anthropic, DeepSeek, etc.)
- **Interactive Selection**: Choose profiles via an interactive CLI menu
- **Easy Configuration**: Simple YAML-based configuration stored in your home directory
- **Auto-Installation**: Automatically installs required dependencies if needed
- **DMG Installer**: Convenient macOS package for easy distribution

## 🚀 Installation

### Using NPM (Recommended)

```bash
# Install globally
npm install -g codemodel-cli
```

### Using the DMG Installer (macOS)

1. Download the latest DMG file from the [releases page](https://github.com/cristianoaredes/codemodel-cli/releases)
2. Open the DMG file
3. Run the `install.sh` script by double-clicking it
4. You may need to grant execution permissions: `chmod +x install.sh`

### From Source

```bash
# Clone the repository
git clone https://github.com/cristianoaredes/codemodel-cli.git
cd codemodel-cli

# Install dependencies
npm install

# Link for development
npm link

# Set up default profiles (optional)
./scripts/setup-profiles.sh
```

## 🔧 Usage

### Setting Up Profiles

Before using the CLI, you'll need to set up at least one profile:

```bash
# Add a new profile
cw add myprofile --provider openai --model gpt-4.1

# Add a profile interactively with guided prompts
cw add myprofile --interactive
```

You can quickly set up default profiles for all major providers:

```bash
# Run the setup script to create default profiles
./scripts/setup-profiles.sh
```

### Managing Profiles

```bash
# List all available profiles
cw list

# Set a profile as active
cw use myprofile

# Select a profile interactively
cw select

# Remove a profile
cw remove myprofile
```

### Running Commands

Once you have an active profile, you can run commands with it:

```bash
# Run with the active profile
cw run <additional args for codex>

# Run with a specific profile
cw run --profile myprofile <additional args for codex>

# Simply using 'cw' without any subcommand will run with the active profile
cw <additional args for codex>
```

## ⚙️ Configuration

Configuration is stored in `~/.codemodel-cli/config.yaml` with the following structure:

```yaml
active: myprofile
profiles:
  myprofile:
    provider: openai
    model: gpt-4.1
  anotherprofile:
    provider: anthropic
    model: claude-3.7-sonnet
```

### Default Models

CodeModel CLI comes pre-configured with recommended models for each provider:

| Provider | Default Model | Description |
|----------|---------------|-------------|
| OpenAI | `gpt-4.1` | Latest coding-focused model from OpenAI |
| Google | `gemini-2.5-pro` | Google's state-of-the-art thinking model with coding capabilities |
| Anthropic | `claude-3.7-sonnet` | Default model for many AI coding platforms |
| DeepSeek | `deepseek-coder-v3` | Specialized coding model with excellent performance |
| Mistral | `mistral-codestral-2501` | Specialized for low-latency coding tasks |
| Qwen | `qwen2.5-coder-32b` | Latest code-specific model from Alibaba |
| OpenRouter | `agentica-org/deepcoder-14b-preview` | Free, high-quality code generation model |

## 📦 Building the DMG

To build a DMG installer for distribution:

```bash
npm run build-dmg
```

The DMG file will be created in the `dist` directory.

## 🤝 Contributing

Contributions are welcome! Here's how you can contribute:

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Submit a pull request

Please ensure your code follows the existing style and includes appropriate tests.

### Development Setup

```bash
# Clone your fork
git clone https://github.com/yourusername/codemodel-cli.git
cd codemodel-cli

# Install dependencies
npm install

# Link for development
npm link

# Make changes and test locally
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Cristiano Aredes**

- GitHub: [@cristianoaredes](https://github.com/cristianoaredes)
- LinkedIn: [@cristianoaredes](https://www.linkedin.com/in/cristianoaredes/)

## ❓ Troubleshooting

### Common Issues

**Q: The `cw` command is not found after installation**  
A: Ensure your global npm bin directory is in your PATH. You can check with `npm bin -g`.

**Q: I get an error about codex not being installed**  
A: The tool should automatically install codex, but if it fails, you can install it manually with `npm install -g @openai/codex`.

**Q: How do I update to the latest version?**  
A: Run `npm update -g codemodel-cli`.

## 📞 Support

For issues, questions, or feature requests, please [open an issue](https://github.com/cristianoaredes/codemodel-cli/issues) on GitHub.

---

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/cristianoaredes">Cristiano Aredes</a> | <a href="https://www.linkedin.com/in/cristianoaredes/">LinkedIn</a></sub>
</div>
