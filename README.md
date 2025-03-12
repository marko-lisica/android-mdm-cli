# Android MDM CLI

![Cover image for anroid-mdm CLI](./cover-img.png)

`android-mdm` is a CLI tool for interacting with Android Enterprise. You can try out features of the [Android Management API (AMAPI)](https://developers.google.com/android/management). With this tool, you can register for Android Enterprise, bind it to your Google Cloud project, enroll devices, enforce policies, and more. You can use `am` alias to run this CLI.

AMAPI is limited until you're an EMM solution (MDM tool) that has been added to the [EMM directory](https://androidenterprisepartners.withgoogle.com/emm/) by Google. To learn more about these limitations, refer to the [permissible usage](https://developers.google.com/android/management/permissible-usage) page.

**TL;DR:** You can enroll up to 500 devices and perform 1000 queries every 100 seconds for each project.

This tool could be useful for experimenting with AMAPI, testing, or possibly managing a small number of devices.

This project was developed during the research phase of Fleet's Android MDM project, during which I extensively engaged with the Android Management API (AMAPI) to explore its capabilities. My goal was to simplify the process for others, leading to the creation of this tool to facilitate easier interactions with AMAPI. Fleet itself offers a broader range of features, including UI/API/GitOps interfaces for managing a large number of devices. To learn more, visit [fleetdm.com](https://fleetdm.com).

## How to guide

### Instalation

Install npm package globally, to make it accessible from anywhere in the terminal.

```bash
npm install -g android-mdm-cli
```

To manage Android devices with `android-mdm` CLI you need to do following.

1. Create Google Cloud project.
2. Enable Android Management API for that project.
3. Create service account that has necessary permissions to manage Android.
4. Create signup URL with `android-mdm create-signup-url`, open URL from response and register new Android Enterprise.
5. Bind registered Android Enterprise to your Google Cloud project.
6. Create enrollment token and default policy
7. Use enrollment token to enroll device.
8. You can add policies and enforce them on your devices (e.g. enforce password requirements, install apps from Play Store, and much more).

See details about each step below.

### Create Google Cloud project and service account

Follow [this guide](https://developers.google.com/android/management/service-account) to create Google Cloud project, enable Android Management API and create service account key that's necessary to use this CLI. You'll be prompted to provide Google Cloud project ID and service account key file.

### Register Android Enterprise

First step in order to manage Android devices is to register Android Enterprise and bind it to Google Cloud project via `android-mdm create-signup-url` and `android-mdm enterprises bind` commands.
Use these commands and follow instructions to register and bind your Android Enterprise.

### Default Android Enterprise

`android-mdm` CLI has option to save configuration and have `defaultEnterprise` that will be used (if you have multiple bound) in all your requests (e.g. each policy is tied to Android Enterprise). This way, you don't need to specify `--enterprise-name` each time you're managing policies, enrollment tokens, etc. You'll be prompted to input your default enterprise when you run CLI for the first time, but you can always edit config file that's in your home folder.

### Enrollment token

To enroll device to your Android Enterprise, you need to run `android-management enrollment-tokens add` command. Command will return URL that you need to open on your Android device. This URL automatically initiate enrollment wizard when open on Android device. Each enrollment token should have policy assigned to it. This is policy that will be enforced on device when enrolled. Learn about policies in the section below. If you want to enroll BYOD (bring your own device) device use `--byod` flag. Default enrollment token is for company-owned devices, so device will be [fully managed](https://developers.google.com/android/management/provision-device#company-owned_devices_for_work_use_only).

### Policies

Policies are used to enforce settings and install/define allowed apps. Policy can be applied to one or more devices. However, each device can only have a single policy at any given time. A device should be associated with a policy during device enrollment. You can also create default policy that will be applied to each enrolled device and later you can update policy for each device.

#### How to create a policy.

First, you need to create JSON file, using options available [here](https://developers.google.com/android/management/reference/rest/v1/enterprises.policies#resource:-policy).

Here is an example of a policy JSON file:

```json
{
  "passwordRequirements": {
    "passwordMinimumLength": 6,
    "passwordQuality": "ALPHABETIC"
  }
}
```

Once you created your policy JSON file, use `android-management policies patch --file path/to/policy-file.json --id policyIdString` to add policy to your enterprise. You can use same command to update (patch) existing policy.

#### Default policy

To create a default policy that will be applied to each enrolled device, use the command above and set `--id` to `default`.

### Manage devices

You can use `devices` command to list devices, get details about specific device, update policy & state, and run commands (lock, reboot, lost mode, etc.). Run `android-mdm devices -h` to learn about each option. Once you run command, you can use `operations` command to get list of queued commands or to cancel.

### Contribution/suggestions

If you want to suggest an improvement please create an issue. Feel free to open PR to improve CLI.
