const path = require('path')

module.exports = (api, options) => {
  const fs = require('fs')
  const useThreads = process.env.NODE_ENV === 'production' && !!options.parallel

  api.chainWebpack(config => {
    config.resolveLoader.modules.prepend(path.join(__dirname, 'node_modules'))

    if (!options.pages) {
      config.entry('app')
        .clear()
        .add('./src/main.tsx')
    }

    config.resolve
      .extensions
        .merge(['.ts', '.tsx'])

    const tsRule = config.module.rule('ts').test(/\.ts$/)
    const tsxRule = config.module.rule('tsx').test(/\.tsx$/)

    // add a loader to both *.ts & vue<lang="ts">
    const addLoader = ({ loader, options }) => {
      tsRule
        .exclude
          .add(filepath => {
            // Don't transpile node_modules
            return /node_modules/.test(filepath)
          })
          .end()
        .use(loader).loader(loader).options(options)
      tsxRule
        .exclude
        .add(filepath => {
          // Don't transpile node_modules
          return /node_modules/.test(filepath)
        })
        .end()
        .use(loader).loader(loader).options(options)
    }

    addLoader({
      loader: 'cache-loader',
      options: api.genCacheConfig('babel-loader', {
        'babel-loader': require('@babel/core/package.json').version,
        'babel-loader': require('babel-loader/package.json').version,
        modern: !!process.env.VUE_CLI_MODERN_BUILD,
        browserslist: api.service.pkg.browserslist
      }, [
        'babel.config.js',
        '.browserslistrc'
      ])
    })

    if (useThreads) {
      addLoader({
        loader: 'thread-loader',
        options:
          typeof options.parallel === 'number'
            ? { workers: options.parallel }
            : {}
      })
    }

    if (api.hasPlugin('babel')) {
      addLoader({
        loader: 'babel-loader'
      })
    }
    /*addLoader({
      loader: 'ts-loader',
      options: {
        transpileOnly: true,
        appendTsSuffixTo: ['\\.vue$'],
        // https://github.com/TypeStrong/ts-loader#happypackmode-boolean-defaultfalse
        happyPackMode: useThreads
      }
    })*/
    // make sure to append TSX suffix
    /*tsxRule.use('ts-loader').loader('ts-loader').tap(options => {
      options = Object.assign({}, options)
      delete options.appendTsSuffixTo
      options.appendTsxSuffixTo = ['\\.vue$']
      return options
    })*/

    if (!process.env.VUE_CLI_TEST) {
      // this plugin does not play well with jest + cypress setup (tsPluginE2e.spec.js) somehow
      // so temporarily disabled for vue-cli tests
      config
        .plugin('fork-ts-checker')
          .use(require('fork-ts-checker-webpack-plugin'), [{
            // vue: true,
            // tslint: options.lintOnSave !== false && fs.existsSync(api.resolve('tslint.json')),
            // formatter: 'codeframe',
            // https://github.com/TypeStrong/ts-loader#happypackmode-boolean-defaultfalse
            checkSyntacticErrors: useThreads
          }])
    }
  })

  if (!api.hasPlugin('eslint')) {
    api.registerCommand('lint', {
      description: 'lint source files with TSLint',
      usage: 'vue-cli-service lint [options] [...files]',
      options: {
        '--format [formatter]': 'specify formatter (default: codeFrame)',
        '--no-fix': 'do not fix errors',
        '--formatters-dir [dir]': 'formatter directory',
        '--rules-dir [dir]': 'rules directory'
      }
    }, args => {
      return require('./lib/tslint')(args, api)
    })
  }
}
