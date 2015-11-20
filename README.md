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
gulp build --env production

```

## Developing

To start livereload server that watches your files diligently and reloads when necessary, run

```sh
gulp watch

```

### Mock data

When developing cordova-based applications in the browser instead of the mobile, it's usually a good idea to provide mock functionality for the various device functionalities! [This Chrome extension](https://github.com/pbernasconi/chrome-cordova) is highly recommended for development.




Licence
-------

```
Copyright 2015 Aalto University

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```
