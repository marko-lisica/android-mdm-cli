import chalk from 'chalk';
import { Command } from 'commander';
import Table from 'cli-table3';

export const operations = (androidApi, config) => {
  const operationsCommand = new Command('operations').description(
    'Manage operations queued in your Android Enterprise.'
  );

  // operations list command
  operationsCommand
    .command('list')
    .description('List operations queued in your Android Enterprise.')
    .requiredOption(
      '-d, --device <device-id>',
      "Required. Specify the ID of the device to cancel operation queued for it. Run 'devices list' command to get ID of the device."
    )
    .option(
      '-e, --enterprise-name <enterprise-name>',
      "Specify the name of Android Enterprise to get policy from it. Skip if 'defaultEnterprise' is set in config."
    )
    .action((options) => {
      let enterpriseName;

      if (options.enterpriseName) {
        enterpriseName = options.enterpriseName;
      } else if (config.defaultEnterprise) {
        enterpriseName = config.defaultEnterprise;
      } else {
        console.log(
          chalk.red(
            "Please use '--enterprise-name' (e.g enterprises/LC03trycps) or specify defaultEnterprise in config."
          )
        );
        return;
      }

      androidApi.enterprises.devices.operations
        .list({
          name: `${enterpriseName}/devices/${options.device}/operations`
        })
        .then((getOperationsResponse) => {
          const operations = getOperationsResponse.data.operations;

          // ACII table
          const table = new Table({
            head: ['Name (ID)', 'Type', 'Sent'],
            style: {
              head: []
            }
          });

          if (!operations) {
            console.log('');
            console.log(chalk.yellow('No operations available.'));
            return;
          }

          operations.forEach((operation) => {
            const operationId = operation.name.split('/').pop();
            table.push([
              operationId,
              operation.metadata.type,
              operation.metadata.createTime
            ]);
          });

          // Print response
          console.log('');
          console.log(
            chalk.blue(`Operations queued on ${options.device} device:`)
          );
          console.log('');
          console.log(table.toString());
          console.log('');
        })
        .catch((error) => {
          console.error(chalk.red("Couldn't get operations:"), error.message);
          if (error.response) {
            console.error('Details:', error.response.data);
          }
        });
    });

  // operations get command
  operationsCommand
    .command('get')
    .description(
      "Get operation details Run 'operations list' command to get name (ID) of the operation."
    )
    .requiredOption(
      '-d, --device <device-id>',
      "Required. Specify the ID of the device to cancel operation queued for it. Run 'devices list' command to get ID of the device."
    )
    .requiredOption(
      '-i, --id <operation-id>',
      "Required. Specify the name (ID) of the operation to get details. Run 'operations list' command to get name (ID) of the operation."
    )
    .option(
      '-e, --enterprise-name <enterprise-name>',
      "Specify the name of Android Enterprise to get policy from it. Skip if 'defaultEnterprise' is set in config."
    )
    .action((options) => {
      let enterpriseName;

      if (options.enterpriseName) {
        enterpriseName = options.enterpriseName;
      } else if (config.defaultEnterprise) {
        enterpriseName = config.defaultEnterprise;
      } else {
        console.log(
          chalk.red(
            "Please use '--enterprise-name' (e.g enterprises/LC03trycps) or specify defaultEnterprise in config."
          )
        );
        return;
      }

      androidApi.enterprises.devices.operations
        .get({
          name: `${enterpriseName}/devices/${options.device}/operations/${options.id}`
        })
        .then((getOperationsResponse) => {
          const operation = getOperationsResponse.data;

          // Print response
          console.log('');
          console.log(chalk.blue(`'${options.id}' operation details:`));
          console.log('');
          console.log(operation);
        })
        .catch((error) => {
          console.error(chalk.red("Couldn't get operation:"), error.message);
          if (error.response) {
            console.error('Details:', error.response.data);
          }
        });
    });

  // operations cancel command
  operationsCommand
    .command('cancel')
    .description('Cancel operation queued in your Android Enterprise.')
    .requiredOption(
      '-d, --device <device-id>',
      "Required. Specify the ID of the device to cancel operation queued for it. Run 'devices list' command to get ID of the device."
    )
    .requiredOption(
      '-i, --id <operation-id>',
      "Required. Specify the ID of the operation to cancel. Run 'operations list' command to get name (ID) of the operation."
    )
    .option(
      '-e, --enterprise-name <enterprise-name>',
      "Specify the name of Android Enterprise to get policy from it. Skip if 'defaultEnterprise' is set in config."
    )
    .action((options) => {
      let enterpriseName;

      if (options.enterpriseName) {
        enterpriseName = options.enterpriseName;
      } else if (config.defaultEnterprise) {
        enterpriseName = config.defaultEnterprise;
      } else {
        console.log(
          chalk.red(
            "Please use '--enterprise-name' (e.g enterprises/LC03trycps) or specify defaultEnterprise in config."
          )
        );
        return;
      }

      androidApi.enterprises.devices.operations
        .cancel({
          name: `${enterpriseName}/devices/${options.device}/operations/${options.id}`
        })
        .then(() => {
          // Print response
          console.log('');
          console.log(
            chalk.blue(`'${options.id}' operation successfully canceled.`)
          );
          console.log('');
        })
        .catch((error) => {
          console.error(chalk.red("Couldn't cancel operation:"), error.message);
          if (error.response) {
            console.error('Details:', error.response.data);
          }
        });
    });

  return operationsCommand;
};
