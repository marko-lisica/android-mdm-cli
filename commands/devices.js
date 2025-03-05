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
                    head: ['Name (ID)', 'Ownership', 'Last report time', 'Applied policy (ID)'],
                    style: {
                        head: [],
                    },
                });

                if (!devices) {
                    console.log("");
                    console.log(chalk.yellow('No devices enrolled. Use \'enrollment-tokens add\' command to add a enrollment token and use it to enroll device.'));
                    return;
                }

                devices.forEach(device => {
                    const deviceId = device.name.split('/').pop(); 
                    const policyId = device.appliedPolicyName.split('/').pop();

                    let ownership
                    
                    if (device.ownership = "PERSONALLY_OWNED") {
                        ownership = 'BYOD'
                    } else if (device.ownership = "COMPANY_OWNED") {
                        ownership = 'Company-owned'
                    } else {
                        ownership = 'Unspecified'
                    }

                    table.push([
                        deviceId,
                        ownership,
                        device.lastStatusReportTime,
                        policyId
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

    // devices get command
    devicesCommand
        .command('get')
        .description('Get device details. Run \'devices list\' command to get name (ID) of the device.')
        .requiredOption('-n, --name <device-name>', 'Specify the name (ID) of the device to get details.')
        .option('-e, --enterprise-name <enterprise-name>', 'Specify the name of Android Enterprise to get policy from it. Skip if \'defaultEnterprise\' is set in config.')
        .option('--save', 'Save full device details response to a file.')
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
                console.log(chalk.blue("Name:"), deviceDetails.name);
                console.log(chalk.blue("Management mode:"), deviceDetails.managementMode);
                console.log(chalk.blue("State:"), deviceDetails.state);
                console.log(chalk.blue("Entrollment time:"), deviceDetails.enrollmentTime);
                console.log(chalk.blue("Last status report:"), deviceDetails.lastStatusReportTime);
                console.log(chalk.blue("Policy name:"), deviceDetails.policyName);
                console.log(chalk.blue("Enrollment token name:"), deviceDetails.enrollmentTokenName);
                console.log(chalk.blue("Brand:"), deviceDetails.hardwareInfo.brand);
                console.log(chalk.blue("CPU:"), deviceDetails.hardwareInfo.hardware);
                console.log(chalk.blue("Manufacturer:"), deviceDetails.hardwareInfo.manufacturer);
                console.log(chalk.blue("Model:"), deviceDetails.hardwareInfo.model);
                console.log(chalk.blue("Serial number:"), deviceDetails.hardwareInfo.serialNumber);
                console.log(chalk.blue("Ownership:"), deviceDetails.ownership);
                console.log("")
                !options.save ? console.log("Response is long to be displayed in terminal. Use \'--save\' flag to save response to a file.") : console.log("") 

                // Write the response to a file
                if (options.save) {
                    fs.writeFileSync(`${options.name}-device-details.json`, JSON.stringify(deviceDetails, null, 2));
                    console.log(chalk.green(`Full device details response saved to '${options.name}-device-details.json'`));
                }

            }).catch(error => {
                console.error(chalk.red('Couldn\'t get device:'), error.message);
                if (error.response) {
                    console.error('Details:', error.response.data);
                }
            });
        });

    // devices update command
    devicesCommand
        .command('update')
        .description('Update device policy and state. Run \'devices list\' command to get name (ID) of the device.')
        .requiredOption('-n, --name <device-name>', 'Specify the name (ID) of the device to get details.')
        .option('-p, --policy-name <policy-name>', 'Specify the name of the policy to enforce on the device. Run \'policies list\' command to get names (IDs) of the policies.')
        .option('-s, --state <device-state>', 'Update device state. You can set \'active\' or \'disabled\'.')
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

            if (!options.policyName && !options.state) {
                console.log(chalk.red('Please specify either \'--policy-name\' or \'--state\'.'));
                return;
            }

            let deviceState = options.state ? options.state : undefined;
            let policyName = options.policyName ? options.policyName : undefined;
            let devicePatchRequestBody = {};
            let deviceUpdateMask = []

            if (policyName) {
                devicePatchRequestBody.policyName = `${enterpriseName}/policies/${policyName}`;
                deviceUpdateMask.push("policyName");
            }

            if (deviceState) {
                devicePatchRequestBody.state = deviceState.toUpperCase();
                deviceUpdateMask.push("state");
            }


            androidApi.enterprises.devices.patch({
                name: `${enterpriseName}/devices/${options.name}`,
                requestBody: devicePatchRequestBody,
                updateMask: deviceUpdateMask
            }).then(() => {
                // Print response
                console.log("");
                console.log(chalk.blue(`'${options.name}' device updated successfully`));
                console.log("");
            }).catch(error => {
                console.error(chalk.red('Couldn\'t get device:'), error.message);
                if (error.response) {
                    console.error('Details:', error.response.data);
                }
            });
        });

    // devices delete command
    devicesCommand
        .command('delete')
        .description('Delete (unenroll) a device from your Android Enterprise. Run \'devices list\' command to get name (ID) of the device.')
        .requiredOption('-n, --name <policy-name>', 'Specify the name of the policy to delete.')
        .option('-e, --enterprise-name <enterprise-name>', 'Specify the name of Android Enterprise to delete policy from. Skip if \'defaultEnterprise\' is set in config.')
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

            androidApi.enterprises.devices.delete({
                name: `${enterpriseName}/devices/${options.name}`,
            }).then(() => {

                // Print response
                console.log("");
                console.log(chalk.green(`${options.name} device successfully deleted.`));
                console.log("");
            }).catch(error => {
                console.error(chalk.red('Couldn\'t delete device:'), error.message);
                if (error.response) {
                    console.error('Details:', error.response.data);
                }
            });
        });

    return devicesCommand;
};