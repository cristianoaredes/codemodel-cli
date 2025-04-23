#!/bin/bash

# Setup script for default profiles

# Ensure the CLI is installed
if ! command -v cw &> /dev/null; then
    echo "CodeModel CLI is not installed. Please install it first with 'npm link' or via the DMG."
    exit 1
fi

# Create profiles for major providers
echo "Setting up default profiles..."

# OpenAI profile
cw add openai-profile --provider openai --model gpt-4.1
echo "✓ Added OpenAI profile"

# Anthropic profile 
cw add claude-profile --provider anthropic --model claude-3.7-sonnet
echo "✓ Added Claude profile"

# DeepSeek profile
cw add deepseek-profile --provider deepseek --model deepseek-coder-v3
echo "✓ Added DeepSeek profile"

# OpenRouter profile (free)
cw add openrouter-profile --provider openrouter --model agentica-org/deepcoder-14b-preview
echo "✓ Added OpenRouter profile"

# Set default profile
cw use openai-profile
echo "✓ Set OpenAI as default profile"

echo
echo "All profiles have been configured successfully!"
echo "Use 'cw list' to see all profiles"
echo "Use 'cw select' to interactively choose a profile"