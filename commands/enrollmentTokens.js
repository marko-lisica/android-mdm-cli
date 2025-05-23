import chalk from 'chalk';
import { Command } from 'commander';
import Table from 'cli-table3';
import errorMessages from '../cli.js';

export const enrollmentTokens = (androidApi, config) => {
  const enrollmentTokensCommand = new Command('enrollment-tokens').description(
    'Manage enrollment tokens available in your Android Enterprise.'
  );

  // enrollment-tokens add command
  enrollmentTokensCommand
    .command('add')
    .description(
      'Create a new enrollment token and use it to enroll devices in your Android Enterprise.'
    )
    .requiredOption(
      '-n, --name <token-name>',
      'Required. Specify the name of the enrollment token.'
    )
    .option(
      '--byod',
      'Specify if possible to enroll BYOD devices to your Android Enterprise.'
    )
    .option(
      '-e, --enterprise-name <enterprise-name>',
      "Specify the name of Android Enterprise to create an enrollment token for. Skip if 'defaultEnterprise' is set in the config."
    )
    .action((options) => {
      let enterpriseName;

      if (options.enterpriseName) {
        enterpriseName = options.enterpriseName;
      } else if (config.defaultEnterprise) {
        enterpriseName = config.defaultEnterprise;
      } else {
        console.log(chalk.red(errorMessages.missingEnterpriseName));
        return;
      }

      const requestBody = {
        policyName: `${enterpriseName}/policies/default`
      };

      // If --byod specified add 'allowPersonalUsage'
      if (options.byod) {
        requestBody.allowPersonalUsage = 'PERSONAL_USAGE_ALLOWED';
      }

      androidApi.enterprises.enrollmentTokens
        .create({
          parent: enterpriseName,
          requestBody: requestBody
        })
        .then((createEnrollmentTokenResponse) => {
          const response = createEnrollmentTokenResponse.data;
          const tokenValue = response.value;

          // Print response
          console.log('');
          console.log(chalk.blue('Enrollment token successfully created.'));
          console.log('');
          console.log(`Open this URL on Android device:`);
          console.log(
            `https://enterprise.google.com/android/enroll?et=${tokenValue}`
          );
          console.log('');
        })
        .catch((error) => {
          console.log('');
          console.error(
            "Couldn't create enrollment token:",
            error.code + ':',
            error.message
          );
        });
    });

  // enrollment-tokens list command
  enrollmentTokensCommand
    .command('list')
    .description('List enrollment tokens available in your Android Enterprise.')
    .option(
      '-e, --enterprise-name <enterprise-name>',
      "Specify the name of Android Enterprise to list enrollment tokens for it. Skip if 'defaultEnterprise' is set in the config."
    )
    .action((options) => {
      let enterpriseName;

      if (options.enterpriseName) {
        enterpriseName = options.enterpriseName;
      } else if (config.defaultEnterprise) {
        enterpriseName = config.defaultEnterprise;
      } else {
        console.log(chalk.red(errorMessages.missingEnterpriseName));
        return;
      }

      androidApi.enterprises.enrollmentTokens
        .list({
          parent: enterpriseName
        })
        .then((listEnrollmentTokensResponse) => {
          const enrollmentTokens =
            listEnrollmentTokensResponse.data.enrollmentTokens;

          // ACII table
          const table = new Table({
            head: ['Name (ID)', 'Token', 'Expiration time'],
            style: {
              head: []
            }
          });

          if (!enrollmentTokens) {
            console.log('');
            console.log(
              chalk.yellow(
                "No enrollment tokens available. Use 'enrollment-tokens add' command to add a enrollment token."
              )
            );
            return;
          }

          enrollmentTokens.forEach((token) => {
            const tokenId = token.name.split('/').pop();

            table.push([tokenId, token.value, token.expirationTimestamp]);
          });

          // Print response
          console.log('');
          console.log(chalk.blue('Enrollment tokens:'));
          console.log('');
          console.log(table.toString());
          console.log('');
        })
        .catch((error) => {
          console.error(
            chalk.red("Couldn't get enrollment tokens:"),
            error.code + ':',
            error.message
          );
        });
    });

  // enrollment-tokens get command
  enrollmentTokensCommand
    .command('get')
    .description(
      "Get enrollment token details. Run 'enrollment-tokens list' command to get name(ID) of the enrollment token."
    )
    .requiredOption(
      '-n, --name <policy-name>',
      'Required. Specify the name of the enrollment token to get details.'
    )
    .option(
      '-e, --enterprise-name <enterprise-name>',
      "Specify the name of Android Enterprise to get the enrollment token from it. Skip if 'defaultEnterprise' is set in the config."
    )
    .action((options) => {
      let enterpriseName;

      if (options.enterpriseName) {
        enterpriseName = options.enterpriseName;
      } else if (config.defaultEnterprise) {
        enterpriseName = config.defaultEnterprise;
      } else {
        console.log(chalk.red(errorMessages.missingEnterpriseName));
        return;
      }

      androidApi.enterprises.enrollmentTokens
        .get({
          name: `${enterpriseName}/enrollmentTokens/${options.name}`
        })
        .then((getEnrollmentTokensResponse) => {
          const enrollmentTokenDetails = getEnrollmentTokensResponse.data;

          // Print response
          console.log('');
          console.log(
            chalk.blue(`'${options.name}' enrollment token details:`)
          );
          console.log('');
          console.log(enrollmentTokenDetails);
        })
        .catch((error) => {
          console.log('');
          console.error(
            chalk.red("Couldn't get policy:"),
            error.code + ':',
            error.message
          );
        });
    });

  // enrollment-tokens delete command
  enrollmentTokensCommand
    .command('delete')
    .description(
      "Delete a enrollment token from your Android Enterprise. Run 'enrollment-tokens list' command to get name of the enrollment token."
    )
    .requiredOption(
      '-n, --name <policy-name>',
      'Required. Specify the name of the enrollment token to delete.'
    )
    .option(
      '-e, --enterprise-name <enterprise-name>',
      "Specify the name of Android Enterprise to delete the enrollment token from. Skip if 'defaultEnterprise' is set in the config."
    )
    .action((options) => {
      let enterpriseName;

      if (options.enterpriseName) {
        enterpriseName = options.enterpriseName;
      } else if (config.defaultEnterprise) {
        enterpriseName = config.defaultEnterprise;
      } else {
        console.log(chalk.red(errorMessages.missingEnterpriseName));
        return;
      }

      androidApi.enterprises.enrollmentTokens
        .delete({
          name: `${enterpriseName}/enrollmentTokens/${options.name}`
        })
        .then(() => {
          // Print response
          console.log('');
          console.log(
            chalk.green(
              `${options.name} enrollment token successfully deleted.`
            )
          );
          console.log('');
        })
        .catch((error) => {
          console.log('');
          console.error(
            chalk.red("Couldn't delete enrollment token:"),
            error.code + ':',
            error.message
          );
        });
    });

  return enrollmentTokensCommand;
};
