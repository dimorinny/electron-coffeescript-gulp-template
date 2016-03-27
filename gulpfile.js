var gulp = require('gulp'),
    sequence = require('run-sequence'),
    inject = require('gulp-inject'),
    uglify = require('gulp-uglify'),
    coffee = require('gulp-coffee'),
    concat = require('gulp-concat'),
    minify = require('gulp-minify-css'),
    prefixer = require('gulp-autoprefixer'),
    shell = require('gulp-shell'),
    electron  = require('gulp-atom-electron'),
    del = require('del');

var path = {
    html: [
        'src/index.html'
    ],
    coffee: [
        'src/script/**/*.coffee'
    ],
    scripts: [
        'node_modules/jquery/dist/jquery.min.js',
        'node_modules/semantic-ui-css/semantic.min.js',
        'src/script/**/*.js'
    ],
    styles: [
        'node_modules/semantic-ui-css/semantic.min.css',
        'src/style/**/*.css'
    ],
    semantic: {
        path: 'node_modules/semantic-ui-css/themes/*/**',
        prefix: 'themes'
    }
};

gulp.task('private:clear', function() {
    return del(['dist/**/*', 'packaged-app/**/*'], {force: true});
});

gulp.task('private:clear-compiled', function() {
    return del(['src/script/**/*.js'], {force: true});
});

gulp.task('private:build-coffee', function() {
    return gulp.src(path.coffee, {base: './'})
        .pipe(coffee())
        .pipe(gulp.dest('.'));
});

gulp.task('private:build-js', ['private:build-coffee'], function() {
    return gulp.src(path.scripts)
        .pipe(uglify())
        .pipe(concat('vendor.min.js'))
        .pipe(gulp.dest('dist/'));
});

gulp.task('private:build-css', function() {
    return gulp.src(path.styles)
        .pipe(minify())
        .pipe(prefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9'))
        .pipe(concat('vendor.min.css'))
        .pipe(gulp.dest('dist/'));
});

gulp.task('private:build-html', function() {
    var sources = gulp.src('dist/vendor.min.js');
    var styles = gulp.src('dist/vendor.min.css');

    return gulp.src('src/index.html')
        .pipe(inject(sources, {ignorePath: 'dist/', addRootSlash: false}))
        .pipe(inject(styles, {ignorePath: 'dist/', addRootSlash: false}))
        .pipe(gulp.dest('dist'));
});

gulp.task('private:vendor-semantic', function() {
    return gulp.src(path.semantic.path)
        .pipe(gulp.dest('dist/' + path.semantic.prefix));
});

gulp.task('private:run', shell.task(['electron .']));

gulp.task('private:watch-html', function() {
    gulp.watch(path.html, function() {
        sequence('private:build-html');
    });
});

gulp.task('private:watch-js', function() {
    gulp.watch(path.coffee, function() {
        sequence(
            'private:build-js',
            'private:clear-compiled',
            'private:build-html'
        );
    });
});

gulp.task('private:watch-css', function() {
    gulp.watch(path.styles, function() {
        sequence(
            'private:build-css',
            'private:build-html'
        );
    });
});

gulp.task('default', function(done) {
    sequence(
        'private:clear',
        [
            'private:build-js',
            'private:build-css',
            'private:vendor-semantic'
        ],
        'private:clear-compiled',
        'private:build-html',
        [
            'private:run',
            'private:watch-js',
            'private:watch-css',
            'private:watch-html'
        ],
        done
    );
});