/**
 * Sass wrapper that transparently redirects the legacy render() API
 * to the modern compileString() API, silencing the deprecation warning.
 *
 * Used by Mozaic's PostCSS pipeline via @csstools/postcss-sass.
 */
const sass = require('sass')

function legacyToModernOptions(options) {
  return {
    loadPaths: options.includePaths || [],
    sourceMap: options.sourceMap || false,
    sourceMapIncludeSources: options.sourceMapContents || false,
    style: options.outputStyle || 'expanded',
    indentWidth: options.indentWidth || 2,
    quietDeps: true,
    silenceDeprecations: ['legacy-js-api'],
  }
}

function wrapResult(css, sourceMap) {
  return {
    css: Buffer.from(css),
    map: sourceMap ? Buffer.from(JSON.stringify(sourceMap)) : undefined,
    stats: {
      includedFiles: [],
      entry: '',
      duration: 0,
    },
  }
}

module.exports = Object.assign({}, sass, {
  render(options, callback) {
    try {
      const modernOpts = legacyToModernOptions(options)
      const result = sass.compileString(options.data, modernOpts)

      const wrapped = wrapResult(result.css, result.sourceMap)

      // Populate includedFiles
      if (result.loadedUrls) {
        wrapped.stats.includedFiles = result.loadedUrls
          .map((u) => {
            try {
              return u.pathname || u.href || ''
            } catch {
              return ''
            }
          })
          .filter(Boolean)
        wrapped.stats.entry = wrapped.stats.includedFiles[0] || ''
        wrapped.stats.duration = 0
      }

      if (callback) {
        callback(null, wrapped)
      }
      return wrapped
    } catch (error) {
      if (callback) {
        callback(error)
        return
      }
      throw error
    }
  },

  renderSync(options) {
    try {
      const modernOpts = legacyToModernOptions(options)
      const result = sass.compileString(options.data, modernOpts)
      const wrapped = wrapResult(result.css, result.sourceMap)

      if (result.loadedUrls) {
        wrapped.stats.includedFiles = result.loadedUrls
          .map((u) => {
            try {
              return u.pathname || u.href || ''
            } catch {
              return ''
            }
          })
          .filter(Boolean)
      }

      return wrapped
    } catch (error) {
      throw error
    }
  },
})
