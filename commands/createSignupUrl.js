import chalk from 'chalk';
import { Command } from 'commander';

export const createSignupUrl = (androidApi, config) => {
  const command = new Command()
    .name('create-signup-url')
    .description('Create a signup URL for Android Management.')
    .action(() => {
      androidApi.signupUrls
        .create({
          callbackUrl: !config.callbackUrl
            ? 'https://lisica.design'
            : config.callbackUrl,
          projectId: config.projectId
        })
        .then((createSignupUrlResponse) => {
          const signupUrlName = createSignupUrlResponse.data.name;
          const signupUrl = createSignupUrlResponse.data.url;

          // Print response
          console.log('');
          console.log(chalk.blue('Signup URL name:') + ' ', signupUrlName);
          console.log(chalk.blue('Signup URL:') + ' ', signupUrl);
          console.log('');
          console.log(
            "Save signup URL name, because you'll need this to create (bind) Android Enterprise (AE) later."
          );
          console.log('');
          console.log(
            "After you go through registration flow and get enterpriseToken from a callback URL. Use \'enterprisesbind\' command to bind AE to your Google Cloud project with signup URL name enterprise token from callback."
          );
          console.log('');
        })
        .catch((error) => {
          console.error("Couldn't create signup URL:", error.message);
          if (error.response) {
            console.error('Details:', error.response.data);
          }
        });
    });

  return command;
};
