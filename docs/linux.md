# Keyboard Sounds Pro - Linux Support

[Download for Linux](https://github.com/keyboard-sounds/keyboardsounds-pro/releases/latest)

On Linux, in order for the application to detect your input devices your user must be added to the `input` group through `usermod`.

```
sudo usermod -aG input $USER
```

After adding your user to the `input` group, you may need to reboot your system for the changes to take effect.
