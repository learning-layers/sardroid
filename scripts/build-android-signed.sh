#!/usr/bin/env bash
# Script for generating a signed version of the Android APK
cordova build android --verbose --release
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ~/aalto_android.keystore platforms/android/build/outputs/apk/android-x86-release-unsigned.apk google_play
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ~/aalto_android.keystore platforms/android/build/outputs/apk/android-armv7-release-unsigned.apk google_play

