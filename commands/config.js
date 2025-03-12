import chalk from 'chalk';
import { Command } from 'commander';
import { loadConfig, saveConfig } from '../cli.js';

export const configCommand = () => {
  const command = new Command()
    .name('config')
    .description('Update configuration for the CLI tool.')
    .option(
      '-a, --add <key-value>',
      'Add a new key-value pair to the config file (e.g., "defaultEnterprise=enterprises/LC01ro7nu8")'
    )
    .action((options) => {
      // Load existing config
      const config = loadConfig();

      if (options.add) {
        // Split the key-value pair
        const [key, value] = options.add.split('=');

        if (key && value) {
          // Trim to remove any extra spaces
          const trimmedKey = key.trim();
          const trimmedValue = value.trim();

          // Update the config object
          config[trimmedKey] = trimmedValue;

          // Save updated config
          saveConfig(config);
          console.log(
            `${chalk.green('Configuration updated:')} ${trimmedKey} = ${trimmedValue}`
          );
        } else {
          console.error(
            chalk.red('Invalid format. Use: amdm config --add "key=value"')
          );
        }
      } else {
        console.log(
          chalk.yellow(
            'No options provided. Use --add to specify key-value pairs.'
          )
        );
      }
    });

  return command;
};
