module.exports = {
  plugins: [
    require('webp-in-css/plugin'),
    require('postcss-assets')({
      loadPaths: [__dirname + '/dist/css'],
      //cachebuster: true,
      relative: true
    }),
    // require('postcss-cachebuster')({
    //   cssPath: '/' + themename + '/css'
    // }),
    require('postcss-discard-empty'),
    // require('postcss-font-awesome'),
    //require('postcss-resemble-image'),
    // require('postcss-gradient-transparency-fix'),
    require('postcss-inline-svg')({
      //encode: true,
      path: __dirname + '/dist/css'
    }),
    require('postcss-svgo'),
    require('postcss-sort-media-queries')({}),
    // require('postcss-viewport-height-correction'),
    // require('postcss-pxtorem')({
    //   propList: ['*', '!border*'],
    //   mediaQuery: true
    // }),
    //require('webp-in-css/plugin')({ /* options */ }),
    require('postcss-preset-env')({
      autoprefixer: {grid: true, remove: false}
    })
  ]
};
