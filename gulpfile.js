'use strict';

var gulp     = require('gulp');
var gutil    = require('gulp-util');
var concat   = require('gulp-concat');
var gulpif   = require('gulp-if');
var cached   = require('gulp-cached');
var remember = require('gulp-remember');
var replace  = require('gulp-replace-task');

var plumber = require('gulp-plumber');
var beep    = require('beepbeep');
var notify  = require('gulp-notify');

var del      = require('del');
var minimist = require('minimist');

var sass       = require('gulp-sass');
var minifyCSS  = require('gulp-minify-css');
var sourcemaps = require('gulp-sourcemaps');

var minifyHTML  = require('gulp-minify-html');

var browserSync = require('browser-sync');
var reload      = browserSync.reload;

var ngAnnotate = require('gulp-ng-annotate');
var minifyJS   = require('gulp-uglify');
var eslint     = require('gulp-eslint');

var fs     = require('fs');
var xml2js = require('xml2js');

var parser = new xml2js.Parser({ async: false });

var xmlConfig = fs.readFileSync(__dirname + '/config.xml');

var knownOptions = {
    string: 'env',
    default: {
        env             : process.env.NODE_ENV      || 'development',
        turnServer : {
            username    : process.env.TURN_USERNAME || '',
            password    : process.env.TURN_PASSWORD || '',
        },
        rollbar : {
            token       : process.env.ROLLBAR_TOKEN || '',
            environment : process.env.ROLLBAR_ENV   || 'development'
        }
    }
};

var options = minimist(process.argv.slice(2), knownOptions);

parser.parseString(xmlConfig, function (err, results) {
    if (err) { throw err; }
    options.version = results.widget.$.version
});

var onError = function(err) {
    notify.onError({
        title:    "Gulp error in " + err.plugin,
        message:  err.toString()
    })(err);

    beep(3);
    this.emit('end');
};

gulp.task('build', ['scss', 'js', 'html', 'fonts', 'copy-res'], function() {
    gutil.log('Finished building app to folder www');
});

gulp.task('scss', function() {
   return gulp.src(['app/scss/*.scss', './app/vendor/intlpnIonic/scss/intlpn.scss'])
       .pipe(plumber({errorHandler: onError}))
       .pipe(cached('scss'))
       .pipe(gulpif(options.env === 'development', sourcemaps.init()))
       .pipe(sass())
       .on('error', sass.logError)
       .pipe(gulpif(options.env !== 'development', minifyCSS()))
       .pipe(remember('scss'))
       .pipe(concat('app.css'))
       .pipe(gulpif(options.env === 'development', sourcemaps.write()))
       .pipe(gulp.dest('./www/css/'))
       .pipe(reload({stream: true}))
});

gulp.task('html', function() {
    return gulp.src(['./app/**/*.html', '!./app/vendor/**/*.html'])
       .pipe(cached('html'))
       .pipe(gulpif(options.env !== 'development', minifyHTML()))
       .pipe(gulp.dest('./www/'))
       .pipe(reload({stream: true}))
});

gulp.task('ioconfig-replace', function () {
    var start  = 'IONIC_SETTINGS_STRING_START: var settings =' ;
    var config = fs.readFileSync('./.io-config.json', 'utf8')
    var end =  '; return { get: function(setting) { if (settings[setting]) { return settings[setting]; } return null; } };"IONIC_SETTINGS_STRING_END"';

    var replaceWith = start + config + end;

    return gulp.src(['./app/vendor/ionic-platform-web-client/dist/ionic.io.bundle.js'],
            { base: './app' }
        )
        .pipe(replace({
            patterns: [
                {
                    match: /"IONIC_SETTINGS_STRING_START.*IONIC_SETTINGS_STRING_END"/,
                    replacement: function () {
                        return replaceWith;
                    }
                }
            ]
        }))
        .pipe(gulp.dest('./www'))
});

gulp.task('vendor-js', ['ioconfig-replace'],  function() {
   return gulp.src(
       ['./app/vendor/ionic/js/ionic.bundle.js',
        './app/vendor/ngCordova/dist/*.js',
        './app/vendor/jquery/dist/jquery.min.js',
        './app/vendor/peerjs/peer.min.js',
        './app/vendor/rollbar/dist/rollbar.min.js',
        './app/vendor/angular-moment/angular-moment.min.js',
        './app/vendor/moment/moment.js',
        './app/vendor/moment/locale/fi.js',
        './app/vendor/lodash/lodash.min.js',
        './app/vendor/ngstorage/ngStorage.min.js',
        './app/vendor/angular-translate/angular-translate.min.js',
        './app/vendor/intlpnIonic/js/intlpnIonic.js',
        './app/vendor/intlpnIonic/js/data.js',
        './app/vendor/intlpnIonic/lib/libphonenumber/build/utils.js',
        './app/vendor/angular-translate-loader-static-files/angular-translate-loader-static-files.min.js',
        './app/vendor/socket.io-client/socket.io.js',
        './app/vendor/recordrtc/RecordRTC.js',
        './app/vendor/recordrtc/libs/screenshot-dev.js',
        './app/vendor/draggabilly/dist/draggabilly.pkgd.js',
        './app/vendor/fabric.js/dist/fabric.js'],
       { base: './app' })
       .pipe(ngAnnotate())
       .pipe(gulp.dest('./www/'))
});

gulp.task('lint', function () {
    return gulp.src('./app/js/**/*.js')
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError())
});

gulp.task('replace-env', function () {
    return gulp.src('./app/js/env.js', { base: './app'})
       .pipe(replace({
            patterns: [
                {
                    match: 'ROLLBAR_TOKEN',
                    replacement: options.rollbar.token
                },
                {
                    match: 'ROLLBAR_ENV',
                    replacement: options.rollbar.environment
                },
                {
                    match: 'ENVIRONMENT',
                    replacement: options.env
                },
                {
                    match: 'VERSION',
                    replacement: options.version
                },
                {
                    match: 'TURN_USERNAME',
                    replacement: options.turnServer.username
                },
                {
                    match: 'TURN_PASSWORD',
                    replacement: options.turnServer.password
                }
            ]
        }))
       .pipe(gulp.dest('./www/'))
})

gulp.task('copy-res', ['copy-img'], function() {
   return gulp.src(['./app/res/**/*'],
       { base: './app' })
       .pipe(cached('res'))
       .pipe(gulp.dest('./www/'))
       .pipe(reload({stream: true}))
});

gulp.task('copy-img', function() {
   return gulp.src(['./app/img/*'],
       { base: './app' })
       .pipe(gulp.dest('./www/'))
});

gulp.task('fonts', function() {
    return gulp.src(['./app/vendor/ionic/fonts/*'])
    .pipe(gulp.dest('./www/fonts'))
});

gulp.task('js', ['vendor-js', 'replace-env'], function() {
    return gulp.src(['./app/js/**/*', '!./app/js/env.js'])
        .pipe(plumber({errorHandler: onError}))
        .pipe(ngAnnotate())
        .pipe(gulpif(options.env !== 'development', minifyJS()))
        .pipe(cached('js'))
        .pipe(gulp.dest('./www/js/'))
        .pipe(reload({stream: true}))
});

gulp.task('watch', ['build'], function() {
    browserSync({
        server: { baseDir: 'www/' },
        open:   false
    });

    var scss = gulp.watch('./app/scss/*.scss', ['scss'], {cwd: 'www'}, reload);
    var html = gulp.watch(['./app/**/*.html', '!./app/vendor/**/*.html'], ['html'], {cwd: 'www'}, reload);
    var js   = gulp.watch('./app/js/**/*', ['js'], {cwd: 'www'}, reload);
    var res  = gulp.watch('./app/res/**/*', ['copy-res'],  {cwd: 'www'}, reload);

    /*scss.on('change', function(event) {
        if (event.type === 'deleted') {
            gutil.log('Forgetting scss: ' + event.path);
            delete cached.caches.scss[event.path];
            remember.forget('scss', event.path);
        }
    });

    html.on('change', function(event) {
        if (event.type === 'deleted') {
            gutil.log('Forgetting html: ' + event.path);
            delete cached.caches.html[event.path];
        }
    });

    js.on('change', function(event) {
        if (event.type === 'deleted') {
            gutil.log('Forgetting js: ' + event.path);
            delete cached.caches.js[event.path];
        }
    });

    res.on('change', function(event) {
        if (event.type === 'deleted') {
            gutil.log('Forgetting res: ' + event.path);
            delete cached.caches.res[event.path];
        }
    });*/
});

gulp.task('clean', function() {
    return del('www');
});

