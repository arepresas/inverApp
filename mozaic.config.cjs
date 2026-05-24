const path = require('path')

module.exports = {
  stylelint: {
    disabled: true,
  },
  sass: {
    config: {
      includePaths: [
        path.resolve('./node_modules/@mozaic-ds/styles/'),
        path.resolve('./node_modules/@mozaic-ds/styles/components/'),
        path.resolve('./node_modules/@mozaic-ds/styles/generic/'),
        path.resolve('./node_modules/@mozaic-ds/styles/layouts/'),
        path.resolve('./node_modules/@mozaic-ds/styles/settings-tools/'),
        path.resolve('./node_modules/@mozaic-ds/styles/typography/'),
        path.resolve('./node_modules/@mozaic-ds/styles/utilities/'),
        path.resolve('./node_modules/@mozaic-ds/tokens/build/css/'),
        path.resolve('./node_modules/@mozaic-ds/tokens/build/scss/'),
        path.resolve('./node_modules/'),
      ],
      outputStyle: 'expanded',
      indentWidth: 2,
      sass: require('./scripts/sass-modern.cjs'),
    },
  },
}
