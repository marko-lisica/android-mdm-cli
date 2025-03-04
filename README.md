# Android MDM CLI

`andorid-mdm` is a CLI tool to interact with Android Enterprise. You can try [Android Management API (AMAPI)](https://developers.google.com/android/management) features. You can register Android Enterprise, bind to your Google Cloud project, enroll a device, enforce a policy and more.

AMAPI is limited until you're EMM solution (MDM tool) that's added to EMM directory by Google. To learn more about limits, look at [permissable usage](https://developers.google.com/android/management/permissible-usage) page.

TLDR: You can enroll up to 500 devices and do 1000 queries per 100 seconds for each project.

This could be useful to play around AMAPI, test, or possibly manage small amount of devices.

This came out as small project while I was working on [Android MDM project](https://github.com/fleetdm/fleet/issues/19986) at Fleet. Fleet offers more features and UI/API/GitOps interfaces to manage large number of devices. See more at [fleetdm.com](https://fleetdm.com).

## How to guide

To manage Android devices with `andorid-mdm` CLI you need to do following.

1. Create Google Cloud project.
2. Enable Android Management API for that project.
3. Create service account that has necessary permissions to manage Android.
4. Create signup URL with `android-mdm create-signup-url`, open URL from response and register new Android Enterprise.
5. Bind registered Android Enterprise to your Google Cloud project.
6. Create enrollment token and default policy
7. Use enrollment token to enroll device.

See details about each step below.

### Create Google Cloud project 

...


