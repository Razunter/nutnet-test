const {series, parallel, watch, src, dest, task} = require('gulp');
const sriHash = require('gulp-sri-hash');
const browserSync = require('browser-sync').create();
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const postcss = require('gulp-postcss');
const gulpStylelint = require('gulp-stylelint');
const del = require('del');
const gulpif = require('gulp-if');
const pug = require('gulp-pug');
const beautify = require('gulp-beautify');
const babel = require('gulp-babel');
// const svgSprite = require('gulp-svg-sprite');
const terser = require('gulp-terser');
const spritesmith = require('gulp.spritesmith');
const gulpCleanCSS = require('gulp-clean-css');
const cssnano = require('cssnano');
const cache = require('gulp-cache');
const imagemin = require('gulp-imagemin');
const imageminJpegtran = require('imagemin-jpegtran');
const imageminPngquant = require('imagemin-pngquant');
const imageminZopfli = require('imagemin-zopfli');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminGiflossy = require('imagemin-giflossy');
const webp = require('gulp-webp');
const log = require('fancy-log');

let dev = false;
let bs = false;

function clean() {
  return del('dist/*');
}

function css() {
  return src('scss/style.scss')
    .pipe(gulpStylelint({
      fix: true,
      reporters: [
        {formatter: 'string', console: true}
      ]
    }))
    .pipe(gulpif(dev, sourcemaps.init()))
    .pipe(sass({
      includePaths: [
        'node_modules'
      ]
    }).on('error', sass.logError))
    .pipe(postcss())
    .pipe(gulpCleanCSS({
      level: {
        1: {
          all: false,
        },
        2: {
          all: false,
          mergeMedia: true
        }
      },
      inline: false,
      format: 'beautify'
    }))
    .pipe(gulpif(!dev, postcss([
        cssnano()

        // require('@fullhuman/postcss-purgecss')({
        //   content: ['./src/**/*.pug', './src/**/*.html'],
        // })
      ]
    )))
    .pipe(gulpif(dev, sourcemaps.write('.', {
      includeContent: false,
    })))
    .pipe(dest('dist/css'))
    .pipe(gulpif(bs, browserSync.reload({stream: true})));
}

function dependencies(cb) {
  src([
    'node_modules/bootstrap/dist/js/bootstrap.bundle.min.js',
  ])
    .pipe(dest('dist/js'));
  src('src/favicons/*')
    .pipe(dest('dist'));
  return cb();
}

function js() {
  return src('src/script.js')
    .pipe(gulpif(dev, sourcemaps.init()))
    .pipe(babel({
      presets: ['@babel/env']
    }))
    .pipe(gulpif(!dev, terser()))
    .pipe(gulpif(dev, sourcemaps.write('.')))
    .pipe(dest('dist/js'))
  // .on("end", gulpif(bs, browserSync.reload));
}

function html() {
  return src('src/**/*.pug')
    .pipe(pug({basedir: __dirname + '/dist'}))
    .pipe(gulpif(dev, beautify.html({indent_size: 2})))
    .pipe(dest('dist'))
    .on("end", gulpif(bs, browserSync.reload, function () {
    }));
}

// function svgsprite() {
//   return src('src/icons/*.svg')
//     .pipe(svgSprite({
//       mode: {
//         symbol: {
//           dest: '',
//           sprite: 'sprite.svg',
//           inline: true
//         }
//       }
//     }))
//     .pipe(dest('dist/images'));
// }

exports.sprite = function pngsprite(cb) {
  const spriteData = src('img-src/pngsprite/*.png').pipe(spritesmith({
    imgName: 'sprite.png',
    cssName: 'sprite.css',
    padding: 2,
    imgPath: '../images/sprite.png'
  }));
  spriteData.img.pipe(dest('img-src'));
  spriteData.css.pipe(dest('scss'));
  return cb();
}

function sri() {
  return src('dist/**/*.html')
    // do not modify contents of any referenced css- and js-files after this
    // task...
    .pipe(sriHash())
    // ... manipulating html files further, is perfectly fine
    .pipe(dest('dist/'));
}

function images(cb) {
  src('img-src/*.gif')
    .pipe(cache(imagemin([
      imageminGiflossy({
        optimizationLevel: 3,
        optimize: 3,
        lossy: 2
      }),
    ])))
    .pipe(dest('dist/images'))
    .on('end', function () {
      log('Gif done!');
    });

  src('img-src/*.png')
    .pipe(cache(imagemin([
      imageminPngquant({
        speed: 1,
        quality: [0.95, 1]
      }),
      imageminZopfli({
        more: true,
        // iterations: 50 // very slow but more effective
      }),
    ], {
      // verbose: true
    })))
    .pipe(dest('dist/images'))
    .pipe(cache(webp({
      lossless: true
    })), {name: 'webp'})
    .pipe(dest('dist/images'))
    .on('end', function () {
      log('PNG done!');
    });

  src('img-src/*.jpg')
    .pipe(cache(imagemin([
      imageminJpegtran({
        progressive: true
      }),
      imageminMozjpeg({
        quality: 80
      }),
      // imageminGuetzli({quality: 90}),
    ])))
    .pipe(dest('dist/images'))
    .on('end', function () {
      log('JPG done!');
    });

  src('img-src/*.jpg')
    .pipe(cache(webp({
      quality: 70 // Quality setting from 0 to 100
    })), {name: 'webp'})
    .pipe(dest('dist/images'))
    .on('end', function () {
      log('JPG to WebP done!');
    });

  src('img-src/images-quant/**/*.png')
    .pipe(cache(imagemin([
      imageminPngquant({quality: [0.65, .8]}),
      imageminZopfli({
        more: true,
        iterations: 50 // very slow but more effective
      }),
    ])))
    .pipe(dest('dist/images'))
    .on('end', function () {
      log('PNGquant done!');
    });

  src('img-src/*.svg')
    .pipe(cache(imagemin([
      imagemin.svgo({
        removeTitle: true,
        cleanupIDs: true
      })
    ])))
    .pipe(dest('dist/images'))
    .on('end', function () {
      log('SVG done!');
    });

  return cb();
}

exports.default = series(clean, parallel(dependencies, js, css, images), html, sri);
exports.dev = function (cb) {
  dev = true;
  series(clean, parallel(dependencies, js, css, images), html)();
  return cb();
};
exports.browsersync = function () {
  dev = true;
  bs = true;
  let gogogo = series(clean, parallel(dependencies, js, css, images), html, function (cb) {
    watch('scss/**/*.scss', css);
    watch('src/script.js', series(js, html));
    watch(['src/**/*.pug', 'src/**/*.html'], html);

    browserSync.init({
      server: {
        baseDir: "dist/"
      },
      open: false,
    });
    return cb();
  });
  gogogo();
};
exports.clearcache = () => {
  return cache.clearAll();
}
exports.images = series(images);
