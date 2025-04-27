import chalk from 'chalk';
import { Command } from 'commander';
import inquirer from 'inquirer';
import Table from 'cli-table3';
import fs from 'fs';

export const enterprises = (androidApi, config) => {
  const enterprisesCommand = new Command('enterprises').description(
    'Manage Android Enterprises bound to your Google Cloud project.'
  );

  // enterprises bind command
  enterprisesCommand
    .command('bind')
    .description('Bind Android Enterprise to your Google Cloud project.')
    .action(() => {
      // Prompt for signupUrlName and enterpriseToken
      inquirer
        .prompt([
          {
            type: 'input',
            name: 'signupUrlName',
            message:
              "Enter the signup URL name from 'create-signup-url' command:",
            validate: (input) =>
              input.trim() !== '' || "Signup URL name can't be empty."
          },
          {
            type: 'input',
            name: 'enterpriseToken',
            message: 'Enter the enterprise token from the callback URL:',
            validate: (input) =>
              input.trim() !== '' || "Enterprise token can't be empty."
          }
        ])
        .then((answers) => {
          // Use the collected answers in the API call
          const { signupUrlName, enterpriseToken } = answers;

          androidApi.enterprises
            .create({
              projectId: config.projectId,
              signupUrlName: signupUrlName,
              enterpriseToken: enterpriseToken
            })
            .then((createEnterprisesResponse) => {
              const response = createEnterprisesResponse.data;

              // Print response
              console.log('');
              console.log(chalk.blue('Response:') + ' ', response);
              console.log('');
            })
            .catch((error) => {
              console.error(
                chalk.red("Couldn't bind Android Enterprise:"),
                error.message
              );
              if (error.response) {
                console.error('Details:', error.response.data);
              }
            });
        })
        .catch((error) => {
          console.error('Error prompting for input:', error.message);
        });
    });

  // enterprises list command
  enterprisesCommand
    .command('list')
    .description('List Android Enterprises bound to your Google Cloud project.')
    .action(() => {
      androidApi.enterprises
        .list({
          projectId: config.projectId
        })
        .then((getEnterprisesResponse) => {
          const enterprises = getEnterprisesResponse.data.enterprises;

          // ACII table
          const table = new Table({
            head: ['ID', 'Display name'],
            style: {
              head: []
            },
            colWidths: [30, 30]
          });

          if (!enterprises) {
            console.log('');
            console.log(
              chalk.yellow(
                "No enterprises available. Use 'create-signup-url' to signup and create Android Enterprise."
              )
            );
            return;
          }

          enterprises.forEach((enterprise) => {
            const enterpriseId = enterprise.name.split('/').pop();

            table.push([enterpriseId, enterprise.enterpriseDisplayName]);
          });

          // Print response
          console.log('');
          console.log(chalk.blue('Enterprises:'));
          console.log('');
          console.log(table.toString());
          console.log('');
        })
        .catch((error) => {
          console.log('');
          console.error(
            chalk.red("Couldn't get enterprises:"),
            error.code + ':',
            error.message
          );
        });
    });

  // enterprises get command
  enterprisesCommand
    .command('get')
    .description(
      "Get enterprise details. Run 'enterprises list' command to get ID of the enterprise."
    )
    .requiredOption(
      '-i, --id <enterprise-id>',
      'Required. Specify the ID of the enterprise to get details.'
    )
    .action((options) => {
      androidApi.enterprises
        .get({
          name: `enterprises/${options.id}`
        })
        .then((getEnterpriseDetailsResponse) => {
          const enterpriseDetails = getEnterpriseDetailsResponse.data;

          // Print response
          console.log('');
          console.log(chalk.blue(`'${options.id}' enterprise details:`));
          console.log('');
          console.log(enterpriseDetails);
        })
        .catch((error) => {
          console.log('');
          console.error(
            chalk.red("Couldn't get enterprise:"),
            error.code + ': ' + error.message
          );
        });
    });

  // enterprises delete command
  enterprisesCommand
    .command('delete')
    .description(
      'Delete enterprise. WARNING: All devices enrolled to this enterprise will be unenrolled.'
    )
    .requiredOption(
      '-i, --id <enterprise-id>',
      "Required. Specify the ID of the enterprise to get details. Run 'enterprises list' command to get ID of the enterprise."
    )
    .action((options) => {
      androidApi.enterprises
        .delete({
          name: `enterprises/${options.id}`
        })
        .then(() => {
          // Print response
          console.log('');
          console.log(
            chalk.blue(`'${options.id}' enterprise deleted successfully.`)
          );
          console.log('');
        })
        .catch((error) => {
          console.log('');
          console.error(
            chalk.red("Couldn't delete enterprise:"),
            error.code + ': ' + error.message
          );
        });
    });

  // enterprises patch command
  enterprisesCommand
    .command('patch')
    .description(
      'Patch an enterprise. Learn how to make enterprise JSON: https://developers.google.com/android/management/reference/rest/v1/enterprises'
    )
    .requiredOption(
      '-f, --file <file-path>',
      'Required. Specify path to enterprise JSON file.'
    )
    .requiredOption(
      '-i, --id <enterprise-id>',
      'Required. Specify the ID of the enterprise to patch.'
    )
    .action((options) => {
      // Get enterprise JSON file from path provided as -f option
      const enterpriseFilePath = options.file;

      if (fs.existsSync(enterpriseFilePath)) {
        const enterpriseContent = fs.readFileSync(enterpriseFilePath, 'utf-8');
        const requestBody = JSON.parse(enterpriseContent);

        androidApi.enterprises
          .patch({
            name: `enterprises/${options.id}`,
            requestBody: requestBody
          })
          .then((patchEnterpriseResponse) => {
            const response = patchEnterpriseResponse.data;

            console.log('');
            console.log(
              chalk.blue(`'${options.id}' enterprise successfully updated.`)
            );
            console.log('');
            console.log(response);
            console.log('');
          })
          .catch((error) => {
            console.log('');
            console.error(
              "Couldn't patch enterprise:",
              error.code + ':',
              error.message
            );
          });
      } else {
        console.log(
          chalk.red('File does not exist. Please provide a valid path.')
        );
        return;
      }
    });

  return enterprisesCommand;
};
