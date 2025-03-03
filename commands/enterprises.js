import chalk from 'chalk';
import { Command } from 'commander';
import inquirer from 'inquirer';
import Table from 'cli-table3';


export const enterprises = (androidApi, config) => {
    const enterprisesCommand = new Command('enterprises')
    .description('Manage Android Enterprises bound to your Google Cloud project.');

    // enterprises bind command
    enterprisesCommand
        .command('bind')
        .description('Bind registered Android Enterprise to your Google Cloud project.')
        .action(() => {
            // Prompt for signupUrlName and enterpriseToken
            inquirer.prompt([
                {
                    type: 'input',
                    name: 'signupUrlName',
                    message: 'Enter the signup URL name from \'create-signup-url\' command:',
                    validate: (input) => input.trim() !== '' || 'Signup URL name can\'t be empty.',
                },
                {
                    type: 'input',
                    name: 'enterpriseToken',
                    message: 'Enter the enterprise token from the callback URL:',
                    validate: (input) => input.trim() !== '' || 'Enterprise token can\'t be empty.',
                },
            ]).then(answers => {
                // Use the collected answers in the API call
                const { signupUrlName, enterpriseToken } = answers;
    
                androidApi.enterprises.create({
                    projectId: config.projectId,
                    signupUrlName: signupUrlName,
                    enterpriseToken: enterpriseToken,
                }).then(createEnterprisesResponse => {
                    const response = createEnterprisesResponse.data; 
    
                    // Print response
                    console.log("");
                    console.log(chalk.blue('Response:') + ' ', response);
                    console.log("");
                }).catch(error => {
                    console.error(chalk.red('Couldn\'t bind Android Enterprise:'), error.message);
                    if (error.response) {
                        console.error('Details:', error.response.data);
                    }
                });
            }).catch(error => {
                console.error('Error prompting for input:', error.message);
            });
        });
    
    // enterprises list command
    enterprisesCommand
        .command('list')
        .description('List Android Enterprises bound to your Google Cloud project.')
        .action(() => {
            androidApi.enterprises.list({
                projectId: config.projectId,
            }).then(getEnterprisesResponse => {
                const enterprises = getEnterprisesResponse.data.enterprises;

                // ACII table
                const table = new Table({
                    head: ['Name (ID)', 'Display name'],
                    style: {
                        head: [],
                    },
                    colWidths: [30, 30]
                });

                enterprises.forEach(enterprise => {
                    table.push([
                        enterprise.name,
                        enterprise.enterpriseDisplayName,
                    ]);
                });

                // Print response
                console.log("");
                console.log(chalk.blue('Enterprises:'));
                console.log("");
                console.log(table.toString()); 
                console.log("");
            }).catch(error => {
                console.error(chalk.red('Couldn\'t get enterprises:'), error.message);
                if (error.response) {
                    console.error('Details:', error.response.data);
                }
            });
        });

    return enterprisesCommand;
};
