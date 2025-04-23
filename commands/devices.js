import chalk from 'chalk';
import { Command } from 'commander';
import fs from 'fs';
import Table from 'cli-table3';

export const devices = (androidApi, config) => {
  const devicesCommand = new Command('devices').description(
    "Manage Android devices enrolled to your Android Enterprise. Once you issue a command (e.g. lock or reboot) to a device it will be queued as operation. You can manage operations by using 'operations' command."
  );

  // devices list command
  devicesCommand
    .command('list')
    .description('List devices enrolled to your Android Enterprise.')
    .option(
      '-e, --enterprise-name <enterprise-name>',
      "Specify the name of Android Enterprise to list devices for. Skip if 'defaultEnterprise' is set in config."
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

      androidApi.enterprises.devices
        .list({
          parent: enterpriseName
        })
        .then((listDevicesResponse) => {
          const devices = listDevicesResponse.data.devices;

          // ACII table
          const table = new Table({
            head: [
              'ID',
              'Ownership',
              'Last report time',
              'Applied policy (ID)'
            ],
            style: {
              head: []
            }
          });

          if (!devices || devices.length === 0) {
            console.log('');
            console.log(
              chalk.yellow(
                "No devices enrolled. Use 'enrollment-tokens add' command to add a enrollment token and use it to enroll device."
              )
            );
            return;
          }

          devices.forEach((device) => {
            const deviceId = device.name.split('/').pop();
            const policyId = device.appliedPolicyName
              ? device.appliedPolicyName.split('/').pop()
              : 'N/A';

            let ownership;

            if ((device.ownership = 'PERSONALLY_OWNED')) {
              ownership = 'BYOD';
            } else if ((device.ownership = 'COMPANY_OWNED')) {
              ownership = 'Company-owned';
            } else {
              ownership = 'Unspecified';
            }

            table.push([
              deviceId,
              ownership,
              device.lastStatusReportTime,
              policyId
            ]);
          });

          // Print response
          console.log('');
          console.log(chalk.blue('Devices:'));
          console.log(
            chalk.grey(
              "Use 'devices get --id <device_id>' to get all information about specific device."
            )
          );
          console.log('');
          console.log(table.toString());
          console.log('');
        })
        .catch((error) => {
          console.log('');
          console.error(
            chalk.red("Couldn't get devices:"),
            error.code + ':',
            error.message
          );
        });
    });

  // devices get command
  devicesCommand
    .command('get')
    .description(
      "Get device details. Run 'devices list' command to get ID of the device."
    )
    .requiredOption(
      '-i, --id <device-id>',
      'Required. Specify the ID of the device to get details.'
    )
    .option(
      '-e, --enterprise-name <enterprise-name>',
      "Specify the name of Android Enterprise to get policy from it. Skip if 'defaultEnterprise' is set in config."
    )
    .option('--save', 'Save full device details response to a file.')
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

      androidApi.enterprises.devices
        .get({
          name: `${enterpriseName}/devices/${options.id}`
        })
        .then((getDevicesResponse) => {
          const deviceDetails = getDevicesResponse.data;

          // Print response
          console.log('');
          console.log(chalk.blue(`'${options.id}' device details:`));
          console.log('');
          console.log(chalk.blue('Name:'), deviceDetails.name);
          console.log(
            chalk.blue('Management mode:'),
            deviceDetails.managementMode
          );
          console.log(chalk.blue('State:'), deviceDetails.state);
          console.log(
            chalk.blue('Entrollment time:'),
            deviceDetails.enrollmentTime
          );
          console.log(
            chalk.blue('Last status report:'),
            deviceDetails.lastStatusReportTime
          );
          console.log(chalk.blue('Policy name:'), deviceDetails.policyName);
          console.log(
            chalk.blue('Enrollment token name:'),
            deviceDetails.enrollmentTokenName
          );
          console.log(chalk.blue('Brand:'), deviceDetails.hardwareInfo.brand);
          console.log(chalk.blue('CPU:'), deviceDetails.hardwareInfo.hardware);
          console.log(
            chalk.blue('Manufacturer:'),
            deviceDetails.hardwareInfo.manufacturer
          );
          console.log(chalk.blue('Model:'), deviceDetails.hardwareInfo.model);
          console.log(
            chalk.blue('Serial number:'),
            deviceDetails.hardwareInfo.serialNumber
          );
          console.log(chalk.blue('Ownership:'), deviceDetails.ownership);
          console.log('');
          !options.save
            ? console.log(
                "Response is long to be displayed in terminal. Use '--save' flag to save response to a file."
              )
            : console.log('');

          // Write the response to a file
          if (options.save) {
            fs.writeFileSync(
              `${options.id}-device-details.json`,
              JSON.stringify(deviceDetails, null, 2)
            );
            console.log(
              chalk.green(
                `Full device details response saved to '${options.id}-device-details.json'`
              )
            );
          }
        })
        .catch((error) => {
          console.log('');
          console.error(
            chalk.red("Couldn't get device:"),
            error.code + ':',
            error.message
          );
        });
    });

  // devices update command
  devicesCommand
    .command('update')
    .description(
      "Update device policy and state. Run 'devices list' command to get name (ID) of the device."
    )
    .requiredOption(
      '-i, --id <device-id>',
      'Required. Specify the ID of the device to get details.'
    )
    .option(
      '-p, --policy-id <policy-id>',
      "Specify the ID of the policy to enforce on the device. Run 'policies list' command to get IDs of the policies."
    )
    .option(
      '-s, --state <device-state>',
      "Update device state. You can set 'active' or 'disabled'."
    )
    .option(
      '-e, --enterprise-name <enterprise-name>',
      'Specify the name of Android Enterprise to get policy from it. Skip if "defaultEnterprise" is set in config.'
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

      if (!options.policyId && !options.state) {
        console.log(
          chalk.red("Please specify either '--policy-name' or '--state'.")
        );
        return;
      }

      let deviceState = options.state ? options.state : undefined;
      let policyName = options.policyId ? options.policyId : undefined;
      let devicePatchRequestBody = {};
      let deviceUpdateMask = [];

      if (policyName) {
        devicePatchRequestBody.policyName = `${enterpriseName}/policies/${policyName}`;
        deviceUpdateMask.push('policyName');
      }

      if (deviceState) {
        devicePatchRequestBody.state = deviceState.toUpperCase();
        deviceUpdateMask.push('state');
      }

      androidApi.enterprises.devices
        .patch({
          name: `${enterpriseName}/devices/${options.id}`,
          requestBody: devicePatchRequestBody,
          updateMask: deviceUpdateMask
        })
        .then(() => {
          // Print response
          console.log('');
          console.log(
            chalk.blue(`'${options.id}' device updated successfully`)
          );
          console.log('');
        })
        .catch((error) => {
          console.log('');
          console.error(
            chalk.red("Couldn't get device:"),
            error.code + ':',
            error.message
          );
        });
    });

  // devices delete command
  devicesCommand
    .command('delete')
    .description(
      "Delete (unenroll) a device from your Android Enterprise. Run 'devices list' command to get name (ID) of the device."
    )
    .requiredOption(
      '-i, --id <device-id>',
      'Required. Specify the ID of the device to delete.'
    )
    .option(
      '-e, --enterprise-name <enterprise-name>',
      "Specify the name of Android Enterprise to delete policy from. Skip if 'defaultEnterprise' is set in config."
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

      androidApi.enterprises.devices
        .delete({
          name: `${enterpriseName}/devices/${options.id}`
        })
        .then(() => {
          // Print response
          console.log('');
          console.log(
            chalk.green(`${options.id} device successfully deleted.`)
          );
          console.log('');
        })
        .catch((error) => {
          console.log('');
          console.error(
            chalk.red("Couldn't delete device:"),
            error.code + ':',
            error.message
          );
        });
    });

  // devices reset-password command
  devicesCommand
    .command('reset-password')
    .description(
      "Send a command to reset a password on a device. Run 'devices list' command to get name (ID) of the device."
    )
    .requiredOption(
      '-i, --id <device-id>',
      'Required. Specify the ID of the device to run command on.'
    )
    .option(
      '-f, --flags <reset-password-options>',
      'Specify comma separated reset password flags. Available flags: https://developers.google.com/android/management/reference/rest/v1/enterprises.devices/issueCommand#ResetPasswordFlag'
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

      let issueCommandRequestBody = {};

      if (!options.flags) {
        issueCommandRequestBody.type = 'RESET_PASSWORD';
      } else {
        let resetPasswordFlags = options.flags;
        let flagsArray = resetPasswordFlags.split(',');
        issueCommandRequestBody.type = 'RESET_PASSWORD';
        issueCommandRequestBody.resetPasswordFlags = flagsArray;
      }

      androidApi.enterprises.devices
        .issueCommand({
          name: `${enterpriseName}/devices/${options.id}`,
          requestBody: issueCommandRequestBody
        })
        .then((issueCommandResponse) => {
          let response = issueCommandResponse.data;
          // Print response
          console.log('');
          console.log(chalk.blue('Command sent successfully'));
          console.log('');
          console.log(response);
        })
        .catch((error) => {
          console.log('');
          console.error(
            chalk.red("Couldn't send command:"),
            error.code + ':',
            error.message
          );
        });
    });

  // devices reboot command
  devicesCommand
    .command('reboot')
    .description(
      "Send a command to reboot a device. Run 'devices list' command to get name (ID) of the device."
    )
    .requiredOption(
      '-i, --id <device-id>',
      'Required. Specify the ID of the device to run command on.'
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

      let issueCommandRequestBody = {
        type: 'REBOOT'
      };

      androidApi.enterprises.devices
        .issueCommand({
          name: `${enterpriseName}/devices/${options.id}`,
          requestBody: issueCommandRequestBody
        })
        .then((issueCommandResponse) => {
          let response = issueCommandResponse.data;
          // Print response
          console.log('');
          console.log(chalk.blue('Command sent successfully'));
          console.log('');
          console.log(response);
        })
        .catch((error) => {
          console.log('');
          console.error(
            chalk.red("Couldn't send command:"),
            error.code + ':',
            error.message
          );
        });
    });

  // devices lock command
  devicesCommand
    .command('lock')
    .description(
      "Send a command to lock a device, as if the lock screen timeout had expired. Run 'devices list' command to get name (ID) of the device."
    )
    .requiredOption(
      '-i, --id <device-id>',
      'Required. Specify the ID of the device to run command on.'
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

      let issueCommandRequestBody = {
        type: 'LOCK'
      };

      androidApi.enterprises.devices
        .issueCommand({
          name: `${enterpriseName}/devices/${options.id}`,
          requestBody: issueCommandRequestBody
        })
        .then((issueCommandResponse) => {
          let response = issueCommandResponse.data;
          // Print response
          console.log('');
          console.log(chalk.blue('Command sent successfully'));
          console.log('');
          console.log(response);
        })
        .catch((error) => {
          console.log('');
          console.error(
            chalk.red("Couldn't send command:"),
            error.code + ':',
            error.message
          );
        });
    });

  // devices relinquish_ownership command
  devicesCommand
    .command('relinquish-ownership')
    .description(
      "Send a command to remove a work profile from company-owned device. Run 'devices list' command to get name (ID) of the device."
    )
    .requiredOption(
      '-i, --id <device-id>',
      'Required. Specify the ID of the device to run command on.'
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

      let issueCommandRequestBody = {
        type: 'RELINQUISH_OWNERSHIP'
      };

      androidApi.enterprises.devices
        .issueCommand({
          name: `${enterpriseName}/devices/${options.id}`,
          requestBody: issueCommandRequestBody
        })
        .then((issueCommandResponse) => {
          let response = issueCommandResponse.data;
          // Print response
          console.log('');
          console.log(chalk.blue('Command sent successfully'));
          console.log('');
          console.log(response);
        })
        .catch((error) => {
          console.log('');
          console.error(
            chalk.red("Couldn't send command:"),
            error.code + ':',
            error.message
          );
        });
    });

  // devices clear-app-data command
  devicesCommand
    .command('clear-app-data')
    .description(
      "Send a command to clear app data of specified apps. Use '--app_ids' to specify apps. Run 'devices list' command to get name (ID) of the device."
    )
    .requiredOption(
      '-i, --id <device-id>',
      'Required. Specify the ID of the device to run command on.'
    )
    .requiredOption(
      '-a, --app-ids <ids-of-apps>',
      "Required. Specify comma separated app IDs . If not specified, all app data will be cleared. You can find app ID in the URL of the Play Store app (look for 'id=com.example' in the URL.)"
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

      let issueCommandRequestBody = {
        clearAppsDataParams: {}
      };

      let appIds = options.appIds;
      let appIdsArray = appIds.split(',');

      issueCommandRequestBody.clearAppsDataParams.packageNames = appIdsArray;
      console.log(issueCommandRequestBody);

      androidApi.enterprises.devices
        .issueCommand({
          name: `${enterpriseName}/devices/${options.id}`,
          requestBody: issueCommandRequestBody
        })
        .then((issueCommandResponse) => {
          let response = issueCommandResponse.data;
          // Print response
          console.log('');
          console.log(chalk.blue('Command sent successfully'));
          console.log('');
          console.log(response);
        })
        .catch((error) => {
          console.log('');
          console.error(
            chalk.red("Couldn't send command:"),
            error.code + ':',
            error.message
          );
        });
    });

  // devices start-lost-mode command
  devicesCommand
    .command('start-lost-mode')
    .description(
      "Send a command to start a lost mode on a device. Run 'devices list' command to get name (ID) of the device."
    )
    .requiredOption(
      '-i, --id <device-id>',
      'Required. Specify the ID of the device to run command on.'
    )
    .option(
      '--message <lost-mode-message>',
      'Specify a message that will be displayed when lost mode is active on a device.)'
    )
    .option(
      '--email <lost-mode-email>',
      'Specify an email that will be displayed when lost mode is active on a device.)'
    )
    .option(
      '--phone <lost-mode-phone>',
      'Specify a phone number that will be displayed when lost mode is active on a device.)'
    )
    .option(
      '--address <lost-mode-address>',
      'Specify a street address that will be displayed when lost mode is active on a device.)'
    )
    .option(
      '--org <lost-mode-organization>',
      'Specify an organization name that will be displayed when lost mode is active on a device.)'
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

      // Validate at least one option is specified
      if (
        !options.message &&
        !options.email &&
        !options.phone &&
        !options.address &&
        !options.org
      ) {
        console.log(
          chalk.red(
            "Please specify at least one of the following options: '--message', '--email', '--phone', '--address', or '--org'."
          )
        );
        return;
      }

      // Assign option to start lost mode params
      let issueCommandRequestBody = {
        startLostModeParams: {}
      };
      options.message &&
        (issueCommandRequestBody.startLostModeParams.lostMessage = {
          defaultMessage: options.message
        });
      options.email &&
        (issueCommandRequestBody.startLostModeParams.lostEmailAddress =
          options.email);
      options.phone &&
        (issueCommandRequestBody.startLostModeParams.lostPhoneNumber = {
          defaultMessage: options.phone
        });
      options.address &&
        (issueCommandRequestBody.startLostModeParams.lostStreetAddress = {
          defaultMessage: options.address
        });
      options.org &&
        (issueCommandRequestBody.startLostModeParams.lostOrganization = {
          defaultMessage: options.org
        });

      androidApi.enterprises.devices
        .issueCommand({
          name: `${enterpriseName}/devices/${options.id}`,
          requestBody: issueCommandRequestBody
        })
        .then((issueCommandResponse) => {
          let response = issueCommandResponse.data;
          // Print response
          console.log('');
          console.log(chalk.blue('Command sent successfully'));
          console.log('');
          console.log(response);
        })
        .catch((error) => {
          console.log('');
          console.error(
            chalk.red("Couldn't send command:"),
            error.code + ':',
            error.message
          );
        });
    });

  // devices stop-lost-mode command
  devicesCommand
    .command('stop-lost-mode')
    .description(
      "Send a command to stop a lost mode on a device. Run 'devices list' command to get name (ID) of the device."
    )
    .requiredOption(
      '-i, --id <device-id>',
      'Required. Specify the ID of the device to run command on.'
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

      let issueCommandRequestBody = {
        type: 'STOP_LOST_MODE',
        stopLostModeParams: {}
      };

      androidApi.enterprises.devices
        .issueCommand({
          name: `${enterpriseName}/devices/${options.id}`,
          requestBody: issueCommandRequestBody
        })
        .then((issueCommandResponse) => {
          let response = issueCommandResponse.data;
          // Print response
          console.log('');
          console.log(chalk.blue('Command sent successfully'));
          console.log('');
          console.log(response);
        })
        .catch((error) => {
          console.log('');
          console.error(
            chalk.red("Couldn't send command:"),
            error.code + ':',
            error.message
          );
        });
    });

  return devicesCommand;
};
