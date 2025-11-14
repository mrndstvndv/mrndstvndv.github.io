# How to run voidlinux on termux using chroot 🚧 IN PROGRESS 🚧

## Requirements

- root
- busybox
[Magisk](https://github.com/topjohnwu/Magisk) and [KernelSU](https://kernelsu.org) ships with a feature complete binary so you wont need to install this one if your using them as root solutions

**Busybox binary locations for KernelSU and Magisk**
- magisk: `/data/adb/magisk/busybox`
- kernelsu: `/data/adb/ksu/bin`

## Getting the rootfs

https://voidlinux.org/download/

If your download is slow on the default repo link try the other mirrors on <https://xmirror.voidlinux.org>

All live images and rootfs tarballs are usually at:
<https://[repo.url]/live/current>

Make sure to pick the right architecture for your device

## Extract the rootfs and setup sdcard mountpoint

The rootfs should only be extracted on the directories under `/data` because the partition is formatted in ext4 [1][1]

I myself put mine on termux's home directory: `~/void`

```sh
mkdir void
```
```sh
cd void
````
```sh
# Change void-rootfs.tar.xz into  the path of your rootfs
tar xpvf void-rootfs.tar.xz --numeric-owner
# TODO: add an explanation on the flags used in the command
```

```sh
# Optional - add sdcard mountpoint
mkdir -p mnt/sdcard
```

## Make the startup script

Provided below is a startup script. The script be used to start to start the chroot session. Before the script works you must change the variables in the config section with their correspanding values.

- BUSYBOX_BIN: Location of your busybox binary. if you installed it using the termux package manager then you can leave it as blank
- ROOTFS: Location/Path to where you extracted the rootfs
- USER: You don't need to replace it for now. We will though, after we are done with the setup and adding of a non root user
- sdcard mountpoint: Make sure you remove the lines specified below if you did not make the sdcard mountpoint from the previous section

```sh
#!/data/data/com.termux/files/usr/bin/sh

# Config
BUSYBOX_BIN=[path/to/busybox/bin/dir]
ROOTFS=[path/to/where/you/extracted/rootfs]
USER=$1
# End Config

export PATH="/bin:/sbin:/usr/bin:/usr/sbin:$BUSYBOX_BIN"

# fix /dev mount options
busybox mount -o remount,dev,suid /data

busybox mount --bind /dev $ROOTFS/dev
busybox mount --bind /sys $ROOTFS/sys
busybox mount --bind /proc $ROOTFS/proc
busybox mount --bind /dev/pts $ROOTFS/dev/pts
busybox mount --bind /storage/emulated/0 $ROOTFS/mnt/sdcard # Remove this line if you did not make the sdcard mountpoint

# disable termux-exec
unset LD_PRELOAD

export TERM=$TERM
export TMPDIR=/tmp

chroot $ROOTFS /bin/su - $USER

echo "unmounting"

busybox umount $ROOTFS/dev/pts
busybox umount $ROOTFS/proc
busybox umount $ROOTFS/sys
busybox umount $ROOTFS/dev
busybox umount $ROOTFS/mnt/sdcard # Remove this line if you did not make the sdcard mountpoint
```

# Backing up your rootfs

```sh
sudo tar -czpf ~/void-backup.tar.gz -C [extracted-rootfs-dir] \
    --exclude=./tmp/* \
    --exclude=./proc/* \
    --exclude=./sys/* \
    --exclude=./dev/* \
    --exclude=./run/* \
    --one-file-system \
    .
```


## References
[1]: https://github.com/jorggonz2016/Chroot-on-termux?tab=readme-ov-file#extracting-the-rootfs
[2]: [Root] Install Ubuntu in chroot on Android without Linux Deploy - https://ivonblog.com/en-us/posts/termux-chroot-ubuntu/
