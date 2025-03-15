#!/usr/bin/env node
import { google } from 'googleapis';
import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';

// Import commands
import { configCommand } from './commands/config.js';
import { createSignupUrl } from './commands/createSignupUrl.js';
import { enterprises } from './commands/enterprises.js';
import { policies } from './commands/policies.js';
import { enrollmentTokens } from './commands/enrollmentTokens.js';
import { devices } from './commands/devices.js';
import { operations } from './commands/operations.js';

const CONFIG_FILE = path.join(
  process.env.HOME || process.env.HOMEPATH,
  '.amdm_config.json'
);

// Function to load configuration
export const loadConfig = () => {
  if (fs.existsSync(CONFIG_FILE)) {
    return JSON.parse(fs.readFileSync(CONFIG_FILE));
  }
  return {};
};

// Function to save configuration
export const saveConfig = (config) => {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
};

// Function to prompt for configuration
const promptForConfig = () => {
  return inquirer
    .prompt([
      {
        type: 'input',
        name: 'serviceAccountKey',
        message: 'Enter the path to your service account key file:',
        validate: (input) => {
          const absolutePath = path.resolve(input); // Convert to absolute path
          return (
            fs.existsSync(absolutePath) ||
            'File does not exist. Please provide a valid path.'
          );
        }
      },
      {
        type: 'input',
        name: 'projectId',
        message: 'Enter your Google Cloud project ID:',
        validate: (input) =>
          input.trim() !== '' || 'PROJECT_ID cannot be empty.'
      },
      {
        type: 'input',
        name: 'callbackUrl',
        message:
          'Enter the callback URL. This URL is used during signup URL creation (default: https://lisica.design):',
        default: 'https://lisica.design',
        validate: (input) => {
          // Basic URL validation (you can improve this regex for more strict validation)
          const urlPattern = /^(https?:\/\/)[^\s/$.?#].[^\s]*$/i;
          return urlPattern.test(input) || 'Please enter a valid URL.';
        }
      }
    ])
    .then((answers) => {
      // Convert the service account key path to absolute before saving
      answers.serviceAccountKey = path.resolve(answers.serviceAccountKey);
      saveConfig(answers);
      return answers;
    });
};

// Function to check and validate the service account key file
const checkServiceAccountKey = async (config) => {
  if (!fs.existsSync(config.serviceAccountKey)) {
    console.log(chalk.yellow('Service account key file not found.'));
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'serviceAccountKey',
        message: 'Please provide a new path to your service account key file:',
        validate: (input) => {
          const absolutePath = path.resolve(input);
          return (
            fs.existsSync(absolutePath) ||
            'File does not exist. Please provide a valid path.'
          );
        }
      }
    ]);
    // Update the config with the new service account key path
    config.serviceAccountKey = path.resolve(answers.serviceAccountKey);
    saveConfig(config);
  }
};

// Main function to initialize the CLI tool
const main = async () => {
  // Load or prompt for configuration
  let config = loadConfig();
  if (!config.serviceAccountKey || !config.projectId) {
    await promptForConfig()
      .then((answers) => {
        config = answers;
      })
      .catch((error) => {
        console.error('Error prompting for configuration:', error);
      });
  }

  // Check if the service account key file exists
  await checkServiceAccountKey(config);

  // Start the CLI with the loaded configuration
  startCli(config);
};

// Function to start the CLI with the loaded configuration
const startCli = (config) => {
  // Android Management API authentication
  const auth = new google.auth.GoogleAuth({
    keyFile: config.serviceAccountKey,
    scopes: ['https://www.googleapis.com/auth/androidmanagement']
  });

  const androidApi = google.androidmanagement({
    version: 'v1',
    auth: auth
  });

  // Initialize the CLI
  const program = new Command();

  program
    .name('android-management-cli')
    .description('CLI tool to interact with Android Management API')
    .version('1.0.5');

  // Commands
  program.addCommand(createSignupUrl(androidApi, config));
  program.addCommand(enterprises(androidApi, config));
  program.addCommand(configCommand());
  program.addCommand(policies(androidApi, config));
  program.addCommand(enrollmentTokens(androidApi, config));
  program.addCommand(devices(androidApi, config));
  program.addCommand(operations(androidApi, config));

  // Parse command line arguments
  program.parse(process.argv);

  // If no command is provided, show help
  if (!process.argv.slice(2).length) {
    program.outputHelp();
  }
};

// Call the main function
main();
