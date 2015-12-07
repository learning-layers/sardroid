#!/usr/bin/env bash
# This be the provisioning script for vagrant! Way past cool!

# Export locale env variables

export LANG="en_US.UTF-8"
export LC_ALL="en_US.UTF-8"
export LANGUAGE="en_US.UTF-8"

# Android SDK version n stuff
ANDROID_SDK_FILENAME=android-sdk_r24.4.1-linux.tgz
ANDROID_SDK=http://dl.google.com/android/$ANDROID_SDK_FILENAME

sudo apt-get update

sudo apt-get install -y curl git openjdk-7-jdk ant expect

# Install nodejs, because js is best!!!
curl -sL https://deb.nodesource.com/setup_5.x | sudo -E bash -
sudo apt-get install -y nodejs

curl -O $ANDROID_SDK
tar -xzvf $ANDROID_SDK_FILENAME
sudo chown -R vagrant android-sdk-linux/

echo "ANDROID_HOME=~/android-sdk-linux" >> /home/vagrant/.bashrc
echo "export JAVA_HOME=/usr/lib/jvm/java-7-openjdk-i386" >> /home/vagrant/.bashrc
echo "PATH=\$PATH:~/android-sdk-linux/tools:~/android-sdk-linux/platform-tools" >> /home/vagrant/.bashrc

sudo npm install -g bower@1.6.5
sudo npm install -g gulp@3.9.0
sudo npm install -g cordova@5.4.0
sudo npm install -g ionic@1.7.10

 expect -c '
 set timeout -1   ;
 spawn /home/vagrant/android-sdk-linux/tools/android update sdk -u --all --filter platform-tool,android-22,build-tools-22.0.1
 expect { 
     "Do you accept the license" { exp_send "y\r" ; exp_continue }
     eof
 }'

# Install bower and npm dependencies, start livereload server on port 3000
cd /vagrant/
npm install
bower install --allow-root
ionic state restore
gulp watch &

