var gulp = require('gulp');
var webserver = require('gulp-webserver');

gulp.task('default', function () {
    gulp.src('.')
        .pipe(webserver({
            livereload: false,
            directoryListing: false,
            open: false,
            fallback: "./index.html"
        }));
});