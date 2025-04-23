const fs = require('fs');
const os = require('os');
const path = require('path');
const yaml = require('js-yaml');

// Configuration directory and file
const CONFIG_DIR = path.join(os.homedir(), '.codemodel-cli');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.yaml');

// Default model configurations by provider
const DEFAULT_MODELS = {
  openai: 'gpt-4.1',
  gemini: 'gemini-2.5-pro',
  anthropic: 'claude-3.7-sonnet',
  deepseek: 'deepseek-coder-v3',
  mistral: 'mistral-codestral-2501',
  qwen: 'qwen2.5-coder-32b',
  openrouter: 'agentica-org/deepcoder-14b-preview'
};

/**
 * Load configuration from file, or initialize with defaults if not found
 * @returns {Object} Configuration object
 */
function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    return { 
      profiles: {},
      active: null
    };
  }
  
  try {
    return yaml.load(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch (err) {
    console.error(`Error loading config: ${err.message}`);
    // Return a default config if there's an error
    return { profiles: {}, active: null };
  }
}

/**
 * Save configuration to file
 * @param {Object} config Configuration object
 */
function saveConfig(config) {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  
  try {
    fs.writeFileSync(CONFIG_PATH, yaml.dump(config), 'utf8');
  } catch (err) {
    console.error(`Error saving config: ${err.message}`);
  }
}

/**
 * Get the default model for a provider
 * @param {string} provider Provider name
 * @returns {string} Default model name
 */
function getDefaultModel(provider) {
  return DEFAULT_MODELS[provider.toLowerCase()] || '';
}

module.exports = {
  loadConfig,
  saveConfig,
  getDefaultModel,
  DEFAULT_MODELS
};