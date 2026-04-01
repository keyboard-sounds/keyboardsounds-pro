# Keyboard Sounds Pro - MacOS Support

[Download for macOS](https://github.com/keyboard-sounds/keyboardsounds-pro/releases/latest)

## Installing

After downloading the DMG file for MacOS, you may be presented with an error such as "File is corrupted". This is because MacOS applies a "quarantine" flag to the DMG file. This is added to the file because the Keyboard Sounds Pro installer is not signed using an Apple certificate.

> Since I cannot afford the $100/year for an Apple Developer License, I have chose to not sign this application. If you would like to see this application properly signed and you're interested in supporting the project, you can [sponsor me on GitHub](https://github.com/sponsors/nathan-fiscaletti).

With this being the case, in order to actually run the DMG file you will need to remove the quarantine flag manually from the downloaded DMG file.

```sh
xattr -c /path/to/Keyboard-Sounds-Pro.dmg
```

## Permissions

On MacOS, the application requires several permissions to be granted in the "Privacy & Security" section of your "System Settings" application in order for it to run properly.

Keyboard Sounds **should** automatically request these permissions the first time it launches. After granting them, you will need to fully restart the application.

### Accessibility

![Accessibility Grant](../images/accessibility.png)

The Keyboard Sounds Pro application uses the Accessibility permission in order to detect the focused application. This is used in the application rules. Without this permission granted, detecting the currently focused application may not function as expected.

### Automation

![Automation Grant](../images/automation.png)

The Keyboard Sounds Pro application uses the "System Events" permission under Automation as a fallback for detecting the focused application. This is used in the application rules when Accessibility is not enough. Without this permission granted, detecting the currently focused application may not function as expected.

### Input Monitoring

![Input Monitoring Grant](../images/input-monitoring.png)

Keyboard Sounds Pro uses the Input Monitoring permission to listen for key strokes / mouse events in order to know when to trigger audio events. Without this permission granted, the application will not function as expected.
