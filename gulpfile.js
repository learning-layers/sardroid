'use strict';

var gulp   = require('gulp');
var concat = require('gulp-concat');
var gulpif = require('gulp-if');

var del      = require('del');
var minimist = require('minimist');

var sass       = require('gulp-sass');
var minifyCSS  = require('gulp-minify-css');
var sourcemaps = require('gulp-sourcemaps');

var minifyHTML  = require('gulp-minify-html');
var browserSync = require('browser-sync');
var reload      = browserSync.reload;

var minifyJS = require('gulp-uglify');

var knownOptions = {
    string: 'env',
    default: { env: process.env.NODE_ENV || 'development'}
};

var options = minimist(process.argv.slice(2), knownOptions);

gulp.task('default', ['scss', 'js', 'html'], function() {

});

gulp.task('scss', function() {
   return gulp.src('app/scss/app.scss')
       .pipe(gulpif(options.env === 'development', sourcemaps.init()))
       .pipe(sass())
       .on('error', sass.logError)
       .pipe(gulpif(options.env !== 'development', minifyCSS()))
       .pipe(concat('app.css'))
       .pipe(gulpif(options.env === 'development', sourcemaps.write()))
       .pipe(gulp.dest('./www/css/'))
});


gulp.task('html', function() {
    return gulp.src(['./app/**/*.html', '!./app/vendor/**/*.html'])
       .pipe(gulpif(options.env !== 'development', minifyHTML()))
       .pipe(gulp.dest('./www/'))
});

gulp.task('vendor-js', function() {
   return gulp.src(
       ['./app/vendor/ionic/release/js/ionic.bundle.min.js'],
       { base: './app' })
       .pipe(gulp.dest('./www/'))
});

gulp.task('copy-res', function() {
   return gulp.src('./app/config.xml')
       .pipe(gulp.dest('./www/'))
});

gulp.task('js', ['vendor-js'], function() {
    return gulp.src('./app/js/**/*')
        .pipe(gulp.dest('./www/js/'))
});

gulp.task('clean', function() {
    return del('www');
});