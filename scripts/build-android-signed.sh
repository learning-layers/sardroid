#!/usr/bin/env bash
# Script for generating a signed version of the Android APK
# This script presumes you have the keystore in your home directory ( ~ ) and other necessary tools installed and working!

cordova build android --verbose --release
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ~/aalto_android.keystore platforms/android/build/outputs/apk/android-x86-release-unsigned.apk google_play
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ~/aalto_android.keystore platforms/android/build/outputs/apk/android-armv7-release-unsigned.apk google_play

~/Android/Sdk/build-tools/23.0.1/zipalign -v 4 platforms/android/build/outputs/apk/android-x86-release-unsigned.apk SoARx86.apk
~/Android/Sdk/build-tools/23.0.1/zipalign -v 4 platforms/android/build/outputs/apk/android-armv7-release-unsigned.apk SoAR-ARM.apk

