var gulp = require('gulp');
var notify = require('gulp-notify');
var source = require('vinyl-source-stream');
var browserify = require('browserify');
var babelify = require('babelify');
var ngAnnotate = require('browserify-ngannotate');
var browserSync = require('browser-sync').create();
var rename = require('gulp-rename');
var templateCache = require('gulp-angular-templatecache');
var uglify = require('gulp-uglify');
var merge = require('merge-stream');
var babel = require('gulp-babel');
var vueComponent = require('gulp-vue-single-file-component');

// Where our files are located
var jsFiles = "src/js/**/*.js";
var viewFiles = "src/js/**/*.html";

var interceptErrors = function (error) {
  var args = Array.prototype.slice.call(arguments);

  // Send error to notification center with gulp-notify
  notify.onError({
    title: 'Compile Error',
    message: '<%= error.message %>'
  }).apply(this, args);

  // Keep gulp from hanging on this task
  this.emit('end');
};


gulp.task('browserify', ['views'], function () {
  return browserify('./src/js/app.js')
    .transform(babelify, { presets: ["es2015"] })
    .transform(ngAnnotate)
    .bundle()
    .on('error', interceptErrors)
    //Pass desired output filename to vinyl-source-stream
    .pipe(source('main.js'))
    // Start piping stream to tasks!
    .pipe(gulp.dest('./build/'));
});

gulp.task('html', function () {
  return gulp.src("src/index.html")
    .on('error', interceptErrors)
    .pipe(gulp.dest('./build/'));
});

gulp.task('views', function () {
  return gulp.src(viewFiles)
    .pipe(templateCache({
      standalone: true
    }))
    .on('error', interceptErrors)
    .pipe(rename("app.templates.js"))
    .pipe(gulp.dest('./src/js/config/'));
});

gulp.task('scripts', () => gulp.src('./js/*.js')
  .pipe(babel({ plugins: ['@babel/plugin-transform-modules-amd'] }))
  .pipe(gulp.dest('./build'))
  .pipe(browserSync.stream())
);

gulp.task('vue', () => gulp.src('./js/components/*.vue')
  .pipe(vueComponent({ debug: true, loadCssMethod: 'loadCss' }))
  .pipe(babel({ plugins: ['@babel/plugin-transform-modules-amd'] }))
  .pipe(rename({ extname: '.js' }))
  .pipe(gulp.dest('./build'))
  .pipe(browserSync.stream())
);

gulp.task('watch', () => {
  gulp.watch('./js/*.js', ['scripts', browserSync.reload]);
  gulp.watch('./js/components/*.vue',['vue', browserSync.reload]);
});

// This task is used for building production ready
// minified JS/CSS files into the dist/ folder
gulp.task('build', ['html', 'browserify','scripts', 'vue', 'watch'], function () {
  var html = gulp.src("build/index.html")
    .pipe(gulp.dest('./dist/'));

  var js = gulp.src("build/main.js")
    .pipe(uglify())
    .pipe(gulp.dest('./dist/'));

  return merge(html, js);
});

gulp.task('default', ['scripts', 'vue', 'watch', 'html', 'browserify'], function () {

  browserSync.init(['./build/**/**.**'], {
    server: "./build",
    port: 4000,
    notify: false,
    ui: {
      port: 4001
    }
  });
  gulp.watch("src/index.html", ['html']);
  gulp.watch(viewFiles, ['views']);
  gulp.watch(jsFiles, ['browserify']);
});
