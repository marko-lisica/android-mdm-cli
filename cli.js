#!/usr/bin/env node
import { google } from 'googleapis';
import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';

// Import commands
import { configCommand } from './commands/config.js';
import { createSignupUrl } from './commands/createSignupUrl.js';
import { enterprises } from './commands/enterprises.js';
import { policies } from './commands/policies.js';
import { enrollmentTokens } from './commands/enrollmentTokens.js';
import { devices } from './commands/devices.js';


const CONFIG_FILE = path.join(process.env.HOME || process.env.HOMEPATH, '.amdm_config.json');

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
    return inquirer.prompt([
        {
            type: 'input',
            name: 'serviceAccountKey',
            message: 'Enter the path to your service account key file:',
            validate: (input) => {
                const absolutePath = path.resolve(input); // Convert to absolute path
                return fs.existsSync(absolutePath) || 'File does not exist. Please provide a valid path.';
            },
        },
        {
            type: 'input',
            name: 'projectId',
            message: 'Enter your Google Cloud project ID:',
            validate: (input) => input.trim() !== '' || 'PROJECT_ID cannot be empty.',
        },
        {
            type: 'input',
            name: 'callbackUrl',
            message: 'Enter the callback URL. This URL is used during signup URL creation (default: https://lisica.design):',
            default: 'https://lisica.design',
            validate: (input) => {
                // Basic URL validation (you can improve this regex for more strict validation)
                const urlPattern = /^(https?:\/\/)[^\s/$.?#].[^\s]*$/i;
                return urlPattern.test(input) || 'Please enter a valid URL.';
            },
        },
    ]).then(answers => {
        // Convert the service account key path to absolute before saving
        answers.serviceAccountKey = path.resolve(answers.serviceAccountKey);
        saveConfig(answers);
        return answers;
    });
};

// Main function to initialize the CLI tool
const main = () => {
    // Load or prompt for configuration
    let config = loadConfig();
    if (!config.serviceAccountKey || !config.projectId) {
        promptForConfig().then(answers => {
            config = answers;
            startCli(config);
        }).catch(error => {
            console.error('Error prompting for configuration:', error);
        });
    } else {
        startCli(config);
    }
};

// Function to start the CLI with the loaded configuration
const startCli = (config) => {
    // Android Management API authentication
    const auth = new google.auth.GoogleAuth({
        keyFile: config.serviceAccountKey,
        scopes: ['https://www.googleapis.com/auth/androidmanagement'],
    });

    const androidApi = google.androidmanagement({
        version: 'v1',
        auth: auth,
    });

    // Initialize the CLI
    const program = new Command();

    program
        .name('android-management-cli')
        .description('CLI tool to interact with Android Management API')
        .version('1.0.0');

    // Commands
    program.addCommand(createSignupUrl(androidApi, config));
    program.addCommand(enterprises(androidApi, config));
    program.addCommand(configCommand());     
    program.addCommand(policies(androidApi, config));
    program.addCommand(enrollmentTokens(androidApi, config));
    program.addCommand(devices(androidApi, config));


          
               
    // Parse command line arguments
    program.parse(process.argv);

    // If no command is provided, show help
    if (!process.argv.slice(2).length) {
        program.outputHelp();
    }
};

// Call the main function
main();