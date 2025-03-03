import chalk from 'chalk';
import { Command } from 'commander';
import fs from 'fs';
import Table from 'cli-table3';

export const policies = (androidApi, config) => {
    const policiesCommand = new Command('policies')
    .description('Manage Android policies');

    // policies patch command
    policiesCommand
        .command('patch')
        .description('Add/update a policy.')
        .requiredOption('-f, --file <file-path>', 'Required. Specify path to policy JSON file.')
        .requiredOption('-n, --name <policy-name>', 'Required. Specify the name of the policy, to reference in enrollment token or when adding to a device.')
        .option('-e, --enterprise-name <enterprise-name>', 'Specify the name of Android Enterprise to add or update policy for. Skip if \'defaultEnterprise\' is set in config.')
        .action((options) => {

            let policyName = null;

            // Validate that policy name doesn't include spaces.
            if (options.name && options.name.includes(' ')) {
                console.log('Invalid name. Name can\'t include spaces.');
                return;
            }

            if (options.enterpriseName) {
                policyName = `${options.enterpriseName}/policies/${options.name}`;
            } else if (config.defaultEnterprise) {
                policyName = `${config.defaultEnterprise}/policies/${options.name}`;
            } else {
                console.log(chalk.red('Please use \'--enterprise-name\' or specify defaultEnterprise in config.'));
                return;
            }

            // Get JSON policy file from path provided as -f option
            const policyFilePath = options.file;

            if (fs.existsSync(policyFilePath)) {
                const policyContent = fs.readFileSync(policyFilePath, 'utf-8');
                const requestBody = JSON.parse(policyContent);

                androidApi.enterprises.policies.patch({
                    name: policyName,
                    requestBody: requestBody
                }).then(patchPoliciesResponse => {
                    const response = patchPoliciesResponse.data; 

                    console.log("");
                    console.log(chalk.blue(`'${options.name}' policy successfully added.`));
                    console.log("")
                    console.log(response)
                    console.log("");
                }).catch(error => {
                    console.error('Couldn\'t add policy:', error.message);
                    if (error.response) {
                        console.error('Details:', error.response.data);
                    }
                });
            } else {
                console.log(chalk.red('File does not exist. Please provide a valid path.'));
                return;
            }
        });

    // policies list command
    policiesCommand
        .command('list')
        .description('List policies available in your Android Enterprise.')
        .option('-e, --enterprise-name <enterprise-name>', 'Specify the name of Android Enterprise to list policies for. Skip if \'defaultEnterprise\' is set in config.')
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

            androidApi.enterprises.policies.list({
                parent: enterpriseName,
            }).then(listPoliciesResponse => {
                const policies = listPoliciesResponse.data.policies;

                // ACII table
                const table = new Table({
                    head: ['Name (ID)', 'Version'],
                    style: {
                        head: [],
                    },
                });

                if (!policies) {
                    console.log(chalk.yellow('No policies available. Use \'policies patch\' command to add a policy.'));
                    return;
                }

                policies.forEach(policy => {
                    const policyId = policy.name.split('/').pop();

                    table.push([
                        policyId,
                        policy.version,
                    ]);
                });

                // Print response
                console.log("");
                console.log(chalk.blue('Policies:'));
                console.log("");
                console.log(table.toString()); 
                console.log("");
            }).catch(error => {
                console.error(chalk.red('Couldn\'t get policies:'), error.message);
                if (error.response) {
                    console.error('Details:', error.response.data);
                }
            });
        });

    // policies get command
    policiesCommand
        .command('get')
        .description('Get policy details. Run \'policies list\' command to get name of the policy.')
        .requiredOption('-n, --name <policy-name>', 'Specify the name of the policy to get details.')
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

            androidApi.enterprises.policies.get({
                name: `${enterpriseName}/policies/${options.name}`,
            }).then(getPoliciesResponse => {
                const policyDetails = getPoliciesResponse.data;

                // Print response
                console.log("");
                console.log(chalk.blue(`'${options.name}' policy details:`));
                console.log("");
                console.log(policyDetails);
            }).catch(error => {
                console.error(chalk.red('Couldn\'t get policy:'), error.message);
                if (error.response) {
                    console.error('Details:', error.response.data);
                }
            });
        });

    // policies delete command
    policiesCommand
        .command('delete')
        .description('Delete policy from your Android Enterprise. Run \'policies list\' command to get name of the policy.')
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

            androidApi.enterprises.policies.delete({
                name: `${enterpriseName}/policies/${options.name}`,
            }).then(() => {

                // Print response
                console.log("");
                console.log(chalk.green(`${options.name} policy successfully deleted.`));
                console.log("");
            }).catch(error => {
                console.error(chalk.red('Couldn\'t delete policy:'), error.message);
                if (error.response) {
                    console.error('Details:', error.response.data);
                }
            });
        });

    return policiesCommand;
};