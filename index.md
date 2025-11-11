# How to run voidlinux on termux using chroot

## Requirements

- root
- busybox (Mahisk and KernelSU ships with a feature complete binary so you wont need to install this one if your using them as root solutions)

## Download the rootfs tarball from the voidlinux site
https://voidlinux.org/download/

## Extract the rootfs
```sh
tar xpvf void-rootfs.tar.xz --numeric-owner
```

## References
[Root] Install Ubuntu in chroot on Android without Linux Deploy - https://ivonblog.com/en-us/posts/termux-chroot-ubuntu/
