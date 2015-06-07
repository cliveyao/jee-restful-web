/*global -$ */
'use strict';
/*
 * - src
 *   - js
 *   - css
 *   - images
 *   - views
 * - tmp
 * - bower_components
 */
//npm install --save-dev gulp gulp-filter gulp-flatten gulp-imagemin gulp-jshint gulp-minify-css gulp-uglify gulp-useref main-bower-files gulp-load-plugins gulp-clean gulp-cache gulp-concat gulp-rev-all gulp-rename gulp-beautify gulp-size gulp-inject gulp-if wiredep imagemin-pngquant

var gulp = require('gulp'),
    del = require('del'),
    pngquant = require('imagemin-pngquant'),
    $ = require('gulp-load-plugins')(),
    dist = '../src/main/webapp/WEB-INF/static/',
    distViews = '../src/main/webapp/WEB-INF/',
    src = 'src/',
    tmp = 'static/',
    template = 'views/*.html',
    js = 'js/*.js',
    css = 'css/*.css',
    fonts = 'fonts/*',
    images = 'images/*',
    jsFilter = $.filter('**/*.js'),
    cssFilter = $.filter('**/*.css'),
    fontFilter = $.filter('**/*.{eot,svg,ttf,woff,woff2,otf}'),
    htmlFilter = $.filter('**/*.html'),
    nonHtmlFilter = $.filter('**/*.+(js|css|png|jpg|eot|svg|ttf|woff|woff2|otf)'),
    prefix = 'http://localhost:8080/jeews';
var revAll = new $.revAll({
    //不重命名文件
    dontRenameFile: ['.html'] ,
    //无需关联处理文件
    dontGlobal: [ /^\/favicon.ico$/ ,'.bat','.txt'],
    //该项配置只影响绝对路径的资源
    prefix: 'http://static.server.com'
});

// 在页面中插入bower组件
// use starttag <!-- bower:js -->
gulp.task('wiredep', function () {
    var wiredep = require('wiredep').stream;

    return gulp.src(src + template)
        .pipe(wiredep({
        exclude: ['bootstrap-sass-official'],
        ignorePath: /^(\.\.\/)*\.\./
        }))
        .pipe(gulp.dest(tmp));
});
//美化代码
gulp.task('beautify', function() {
    return gulp.src(src+js)
        .pipe(beautify({indentSize: 2}))
        .pipe(gulp.dest(tmp + 'js'))
});
//验证js
gulp.task('jshint', function () {
    return gulp.src(src + js)
        .pipe($.jshint())
        .pipe($.jshint.reporter('default'));
});

//将模板文件中的js css压缩
// use starttag <!-- build:js -->
gulp.task('useref',function() {
    var assets = $.useref.assets();
    return gulp.src(tmp + '**/*.html')
        .pipe(assets)  // 解析html中build:{type}块，将里面引用到的文件合并传过来
        .pipe($.if('*.js', $.uglify()))
        .pipe($.if('*.css', $.minifyCss()))
        .pipe(assets.restore())
        .pipe($.useref())
        //加MD5后缀
        .pipe(revAll.revision())
        .pipe(gulp.dest(tmp))
        //生成映射json文件
        .pipe(revAll.manifestFile())
        .pipe(gulp.dest(tmp));
});
//删除文件夹里的内容
gulp.task('clean', function (cb) {
    del([dist + js,dist + css,dist + fonts,dist + images, tmp + '**/*'], {force:true}, cb);
});

//release 拷贝bower下的资源文件到目标目录
gulp.task('bower',function() {
    //添加return可以告知gulp任务已经结束，否则后续任务依赖当前任务的输出文件的话可能有问题
    //flatten可以去掉一些相对路径，使所有文件在一个目标目录下
    return gulp.src(require('main-bower-files')())
        .pipe(jsFilter)
        .pipe($.flatten())
        .pipe(gulp.dest(tmp+'js'))
        .pipe(jsFilter.restore())
        .pipe(cssFilter)
        .pipe($.flatten())
        .pipe(gulp.dest(tmp+'css'))
        .pipe(cssFilter.restore())
        .pipe(fontFilter)
        .pipe($.flatten())
        .pipe(gulp.dest(tmp+'fonts'));
});
//dev 拷贝bower下的压缩过的资源文件到目标目录
gulp.task('bower:min',function() {
    return gulp.src(require('main-bower-files')({
        'overrides': {
            'jquery': {
                'main': 'dist/jquery.min.js'
            }
        }
        }))
        .pipe(jsFilter)
        .pipe($.flatten())
        .pipe(gulp.dest(tmp+'js'))
        .pipe(jsFilter.restore())
        .pipe(cssFilter)
        .pipe($.flatten())
        .pipe(gulp.dest(tmp+'css'))
        .pipe(cssFilter.restore())
        .pipe(fontFilter)
        .pipe($.flatten())
        .pipe(gulp.dest(tmp+'fonts'));
});
//压缩css
gulp.task('minifycss',['collect'],function() {
    return gulp.src(tmp + css)      //压缩的文件
        .pipe($.concat('style.css'))    //合并所有css到style.css
        .pipe(gulp.dest(tmp +'css'))    //输出style.css到文件夹
        .pipe($.rename({suffix: '.min'}))   //rename压缩后的文件名
        .pipe($.minifyCss())   //执行压缩
        .pipe(gulp.dest(tmp +'css'));  //输出
});
//压缩js
gulp.task('minifyjs',['collect'],function() {
    return gulp.src(tmp + js)
        .pipe($.concat('main.js'))    //合并所有js到main.js
        .pipe(gulp.dest(tmp +'js'))    //输出main.js到文件夹
        .pipe($.rename({suffix: '.min'}))   //rename压缩后的文件名
        .pipe($.uglify())    //压缩
        .pipe(gulp.dest(tmp +'js'));  //输出
});
//压缩图片 使用cache插件只有新建或修改过的图片才会压缩
gulp.task('minifyimg',['collect'],function() {
    return gulp.src(tmp + images)
        .pipe($.cache($.imagemin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()]
        })))
        .pipe(gulp.dest(tmp + 'images'));
});
//赋值src文件到tmp中
gulp.task('copy',function() {
    return gulp.src(src + '**/*')
        .pipe(gulp.dest(tmp));
});
//release 压缩css js 图片
gulp.task('collect',['bower','copy'],function(cb) {
    //在任务定义的function中传入callback变量，当callback()执行时，任务结束。
    cb();
});
//dev 收集bower中压缩过的文件及src中的文件
gulp.task('collect:min',['bower:min','copy'],function(cb) {
    cb();
});
//release 去掉非压缩的js,css
gulp.task('minify',['collect','minifycss','minifyjs','minifyimg'],function(cb) {
    del([tmp + js,tmp + css, '!' + tmp + '**/*.min.js','!' + tmp + '**/*.min.css'], {force:true}, cb);
});
//dev 将js，css插入到模板文件中
// use starttag <!-- inject:js -->
gulp.task('inject',['collect:min'],function() {
    var target = gulp.src(src + '**/*.html');
    // It's not necessary to read the files (will speed up things), we're only after their paths:
    var sources = gulp.src([tmp + js, tmp + css], {read: false});
    return target.pipe($.inject(sources, {addRootSlash:false, addPrefix: prefix}))
        .pipe(gulp.dest(tmp));
});
//release 压缩后的css和js插入模板文件
gulp.task('minify:inject',['minify'],function() {
    var target = gulp.src(src + '**/*.html');
    var sources = gulp.src([tmp + '**/*.min.js', tmp + '**/*.min.css'], {read: false});
    return target.pipe($.inject(sources, {addRootSlash:false, addPrefix: prefix}))
        .pipe(gulp.dest(tmp));
});
/* 开发 */
gulp.task('dev',['inject'],function() {
    return gulp.src([tmp + '**/*','!'+tmp+'views/app.html'])
        .pipe(htmlFilter)
        .pipe(gulp.dest(distViews))
        .pipe(htmlFilter.restore())
        .pipe(nonHtmlFilter)
        .pipe(gulp.dest(dist))
        .pipe($.size({title: 'dev', gzip: true}));
});
/* 发布,图片、css、js被压缩过 */
gulp.task('release',['minify:inject'],function() {
    return gulp.src([tmp + '**/*','!'+tmp+'views/app.html'])
        .pipe(htmlFilter)
        .pipe(gulp.dest(distViews))
        .pipe(htmlFilter.restore())
        .pipe(nonHtmlFilter)
        .pipe(gulp.dest(dist))
        .pipe($.size({title: 'release', gzip: true}));
});
//默认任务
gulp.task('default',['clean'], function () {
    gulp.start('dev');
});
//监听文件
gulp.task('watch', function () {
    var watcher = gulp.watch(src+'**/*');
    watcher.on('change', function(event) {
        console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
    });
});