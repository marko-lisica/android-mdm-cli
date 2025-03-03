import chalk from 'chalk';
import { Command } from 'commander';
import fs from 'fs';
import Table from 'cli-table3';

export const devices = (androidApi, config) => {
    const devicesCommand = new Command('devices')
    .description('Manage Android devices enrolled to your Android Enterprise.');

    // devices list command
    devicesCommand
        .command('list')
        .description('List devices enrolled to your Android Enterprise.')
        .option('-e, --enterprise-name <enterprise-name>', 'Specify the name of Android Enterprise to list devices for. Skip if \'defaultEnterprise\' is set in config.')
        .action((options) => {

            let enterpriseName;

            if (options.enterpriseName) {
                enterpriseName = options.enterpriseName;
            } else if (config.defaultEnterprise) {
                enterpriseName = config.defaultEnterprise;
            } else {
                console.log(chalk.red('Please use \'--enterprise-name\' or specify defaultEnterprise in config.'));
                return;
            }

            androidApi.enterprises.devices.list({
                parent: enterpriseName,
            }).then(listDevicesResponse => {
                const devices = listDevicesResponse.data.devices;

                // ACII table
                const table = new Table({
                    head: ['Name (ID)', 'Ownership', 'Last report time', 'Applied policy'],
                    style: {
                        head: [],
                    },
                    colWidths: [50, 20, 30, 50]
                });

                devices.forEach(device => {

                    let ownership
                    
                    if (device.ownership = "PERSONALLY_OWNED") {
                        ownership = 'BYOD'
                    } else if (device.ownership = "COMPANY_OWNED") {
                        ownership = 'Company-owned'
                    } else {
                        ownership = 'Unspecified'
                    }

                    table.push([
                        device.name,
                        ownership,
                        device.lastStatusReportTime,
                        device.appliedPolicyName
                    ]);
                });

                // Print response
                console.log("");
                console.log(chalk.blue('Devices:'));
                console.log(chalk.grey('Use \'devices get --name <Name (ID)>\' to get all information about specific device.'));
                console.log("");
                console.log(table.toString());
                console.log("");
            }).catch(error => {
                console.error(chalk.red('Couldn\'t get devices:'), error.message);
                if (error.response) {
                    console.error('Details:', error.response.data);
                }
            });
        });

    // TODO: better explanation how to find ID of the device    
    // devices get command
    devicesCommand
        .command('get')
        .description('Get device details. Run \'devices list\' command to get name (ID) of the device.')
        .requiredOption('-n, --name <device-name>', 'Specify the name (ID) of the device to get details.')
        .option('-e, --enterprise-name <enterprise-name>', 'Specify the name of Android Enterprise to get policy from it. Skip if \'defaultEnterprise\' is set in config.')
        .action((options) => {

            let enterpriseName;

            if (options.enterpriseName) {
                enterpriseName = options.enterpriseName;
            } else if (config.defaultEnterprise) {
                enterpriseName = config.defaultEnterprise;
            } else {
                console.log(chalk.red('Please use \'--enterprise-name\' or specify defaultEnterprise in config.'));
                return;
            }

            androidApi.enterprises.devices.get({
                name: `${enterpriseName}/devices/${options.name}`,
            }).then(getDevicesResponse => {
                const deviceDetails = getDevicesResponse.data;

                // Print response
                console.log("");
                console.log(chalk.blue(`'${options.name}' device details:`));
                console.log("");
                console.log(deviceDetails);
            }).catch(error => {
                console.error(chalk.red('Couldn\'t get device:'), error.message);
                if (error.response) {
                    console.error('Details:', error.response.data);
                }
            });
        });

    return devicesCommand;
};