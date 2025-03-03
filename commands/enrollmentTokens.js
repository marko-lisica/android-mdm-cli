import chalk from 'chalk';
import { Command } from 'commander';

export const enrollmentTokens = (androidApi, config) => {
    const command = new Command()
        .name('enrollment-token')
        .description('Create a enrollment token to enroll device to your Android Enterprise.')
        .requiredOption('-n, --name <token-name>', 'Specify the name of enrollment token.')
        .option('--byod', 'Specify if possible to enroll BYOD devices to your Android Enterprise.')
        .option('-e, --enterprise-name <enterprise-name>', 'Specify the name of Android Enterprise to create enrollment token for. Skip if \'defaultEnterprise\' is set in config.')
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

            // TODO: Is name necessary?
            const requestBody = {
                name: options.name,
                policyName: `${enterpriseName}/policies/default`,
            };
            
            // If --byod specified add 'allowPersonalUsage'
            if (options.byod) {
                requestBody.allowPersonalUsage = "PERSONAL_USAGE_ALLOWED";
            }

            androidApi.enterprises.enrollmentTokens.create({
                parent: enterpriseName,
                requestBody: requestBody
            }).then(createEnrollmentTokenResponse => {
                const response = createEnrollmentTokenResponse.data;
                const tokenValue = response.value

                // Print response
                console.log("");
                console.log(chalk.blue('Enrollment token successfully created.'));
                console.log("");
                console.log(`Open this URL on Android device:`)
                console.log(`https://enterprise.google.com/android/enroll?et=${tokenValue}`);
                console.log("");
            }).catch(error => {
                console.error('Couldn\'t create enrollment token:', error.message);
                if (error.response) {
                    console.error('Details:', error.response.data);
                }
            });
        });

    return command;
};
