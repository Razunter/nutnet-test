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
const svgSprite = require('gulp-svg-sprite');
const terser = require('gulp-terser');
const spritesmith = require('gulp.spritesmith');
const gulpCleanCSS = require('gulp-clean-css');
const cssnano = require('cssnano');

let dev = false;
let bs = false;

function clean() {
  return del('dist/*');
}

function css() {
  return src('scss/index.scss')
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
    .pipe(gulpif(!dev, postcss([cssnano()])))
    .pipe(gulpif(dev, sourcemaps.write('.', {
      includeContent: false,
    })))
    .pipe(dest('dist/'))
    .pipe(gulpif(bs, browserSync.reload({stream: true})));
}

function dependencies(cb) {
  src([
    'node_modules/bootstrap/dist/js/bootstrap.min.js',
    'node_modules/@popperjs/core/dist/umd/popper-lite.min.js',
  ])
    .pipe(dest('dist/js'));
  src('src/favicons/*')
    .pipe(dest('dist'));
  cb();
}

function js() {
  return src('src/script.js')
    .pipe(gulpif(dev, sourcemaps.init()))
    .pipe(babel({
      presets: ['@babel/env']
    }))
    .pipe(terser())
    .pipe(gulpif(dev, sourcemaps.write('.')))
    .pipe(dest('dist/js'))
  // .on("end", gulpif(bs, browserSync.reload));
}

function html() {
  return src('src/**/*.pug')
    .pipe(pug({}))
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
    cssName: 'sprite.scss'
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

exports.default = series(clean, parallel(dependencies, js, css), html, sri);
exports.dev = function (cb) {
  dev = true;
  series(clean, parallel(dependencies, js, css), html)();
  cb();
};
exports.browsersync = function () {
  dev = true;
  bs = true;
  let gogogo = series(clean, parallel(dependencies, js, css), html, function (cb) {
    watch('scss/style.scss', css);
    watch('src/script.js', series(js, html));
    watch(['src/**/*.pug', 'src/**/*.html'], html);

    browserSync.init({
      server: {
        baseDir: "dist/"
      }
    });
    cb();
  });
  gogogo();
};
