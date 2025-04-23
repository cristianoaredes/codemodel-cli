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

// Default backend configurations by provider
const DEFAULT_BACKENDS = {
  openai: 'openai',
  gemini: 'gpt',
  anthropic: 'anthropic',
  deepseek: 'openai',  // Many use OpenAI-compatible APIs
  mistral: 'openai',   // Many use OpenAI-compatible APIs
  qwen: 'openai',      // Many use OpenAI-compatible APIs
  openrouter: 'openai' // OpenRouter uses OpenAI-compatible API
};

/**
 * Load configuration from file, or initialize with defaults if not found
 * @returns {Object} Configuration object
 */
function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    return { 
      profiles: {},
      active: null,
      backend: {
        active: 'openai',
        custom: {}
      }
    };
  }
  
  try {
    const config = yaml.load(fs.readFileSync(CONFIG_PATH, 'utf8'));
    
    // Ensure backend config exists (for backward compatibility)
    if (!config.backend) {
      config.backend = {
        active: 'openai',
        custom: {}
      };
    }
    
    return config;
  } catch (err) {
    console.error(`Error loading config: ${err.message}`);
    // Return a default config if there's an error
    return { 
      profiles: {}, 
      active: null,
      backend: {
        active: 'openai',
        custom: {}
      }
    };
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

/**
 * Get the default backend for a provider
 * @param {string} provider Provider name
 * @returns {string} Default backend name
 */
function getDefaultBackend(provider) {
  return DEFAULT_BACKENDS[provider.toLowerCase()] || 'openai';
}

/**
 * Get the current backend configuration
 * @returns {Object} Backend configuration object
 */
function getBackendConfig() {
  const config = loadConfig();
  return config.backend || { active: 'openai', custom: {} };
}

/**
 * Set the active backend
 * @param {string} backend Backend name
 */
function setActiveBackend(backend) {
  const config = loadConfig();
  if (!config.backend) {
    config.backend = { active: backend, custom: {} };
  } else {
    config.backend.active = backend;
  }
  saveConfig(config);
}

/**
 * Set a custom backend configuration
 * @param {string} name Custom backend name
 * @param {Object} settings Backend settings
 */
function setCustomBackend(name, settings) {
  const config = loadConfig();
  if (!config.backend) {
    config.backend = { active: 'openai', custom: {} };
  }
  if (!config.backend.custom) {
    config.backend.custom = {};
  }
  config.backend.custom[name] = settings;
  saveConfig(config);
}

module.exports = {
  loadConfig,
  saveConfig,
  getDefaultModel,
  getDefaultBackend,
  getBackendConfig,
  setActiveBackend,
  setCustomBackend,
  DEFAULT_MODELS,
  DEFAULT_BACKENDS
};