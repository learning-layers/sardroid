# Sardroid

Hi there!

Welcome to the SAR-HR hybrid app V2! It's poweved by [Cordova](https://cordova.apache.org/) and 
[Crosswalk](https://crosswalk-project.org/), with npm and bower as the package managers. [Ionic](http://ionicframework.com/)
was chosen as the hybrid framework of choice!

## Installation

First thing's first, install a whole bunch of Node stuff

```sh
npm install -g bower gulp cordova ionic

```

Then, clone this repository and run the following commands to install dependancies

```sh
npm install && bower install

```

Afterwards, run gulp to build the www/ folder, which contains the app itself! Pass the flag --env production
to it to minify CSS, HTML and such when you're about to release the app!

```sh
gulp --env production

```
