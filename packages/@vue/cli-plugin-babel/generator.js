module.exports = api => {
  // Most likely you want to overwrite the whole config to ensure it's working
  // without conflicts, e.g. for a project that used Jest without Babel.
  // It should be rare for the user to have their own special babel config
  // without using the Babel plugin already.
  delete api.generator.files['babel.config.js']

  api.extendPackage({
    babel: {
      presets: ['react-app']
    },
    dependencies: {
      'core-js': '^2.6.5'
    }
  })
}
