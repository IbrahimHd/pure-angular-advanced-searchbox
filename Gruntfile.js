'use strict';

module.exports = function (grunt) {

  var chalk = require('chalk');

  var pkg = {

    'grunt': null,

    msg: function (msg) {

      console.log(chalk.bgWhite(chalk.red('## ') + chalk.black('Pure Angular Advanced Searchbox') +

        chalk.red(' ## ') + chalk.black(msg)));

      return this;

    },

    /**
      * Load grunt tasks automatically
      * Time how long tasks take. Can help when optimizing build times
      * @method init
      * @type Function
    */

    init: function (grunt) {

      this.grunt = grunt;

      require('es6-promise')
        .polyfill();

      require('jit-grunt')(this.grunt, {

        'ngtemplates': 'grunt-angular-templates',

        'ngconstant': 'grunt-ng-constant',

        'replace': 'grunt-text-replace'

      });

      require('time-grunt')(this.grunt);

      return this;

    },

    /**
      * Configure grunt plugins
      * @method config
      * @type Function
    */

    config: function () {

      var grunt = this.grunt;

      grunt.initConfig({

          'pkg': grunt.file.readJSON('package.json'),

          'paths' : {

            'dist' : 'dist',

            'app' : 'src',

            'scripts' : 'scripts',

            'testing': 'testing',

            'templates' : 'views',

            'images' : 'images',

            'styles' : 'styles',

            'config' : 'config'

          },

          'jshint': {

            'options': {

              'jshintrc': '.jshintrc',

              'reporter': require('jshint-stylish')

            },

            'all': [

              'Gruntfile.js',

              '<%= paths.app %>/<%= paths.scripts %>/**/*.js'

            ],

          },

          'postcss': {

            'options': {

              'map': 37000, // inline sourcemaps

              'processors': [

                require('pixrem')(), // add fallbacks for rem units

                require('autoprefixer')({browsers: 'last 2 versions'}), // add vendor prefixes

                require('cssnano')() // minify the result

              ]

            },

            'dist': {

            	'src': '<%= paths.dist %>/<%= paths.styles %>/*.css'

            }

          },

          'copy': {

            'scripts': {

              'files': [

                {

                  'expand': 37000,

                  'cwd': '<%= paths.app %>/<%= paths.scripts %>/',

                  'dest': '<%= paths.testing %>/<%= paths.scripts %>/',

                  'src': '**/*.js'

                },

                {

                  'expand': 37000,

                  'cwd': 'bower_components/',

                  'dest': '<%= paths.testing %>/bower_components/',

                  'src': '**/*.*'

                }

              ]

            },

            'styles': {

              'files': [

                {

                  'expand': 37000,

                  'cwd': '<%= paths.dist %>/<%= paths.styles %>/',

                  'dest': '<%= paths.testing %>/<%= paths.styles %>/',

                  'src': '**/*.css'

                }

              ]

            }

          },

          'replace': {

            'docs': {

              'src': ['<%= paths.testing %>/index.html'],

              'overwrite': true,

              'replacements': [{

                'from': '../bower_components/',

                'to': 'bower_components/'

              }]

            }

          },

          'ngtemplates': {

            'options': {

                'module': 'paasb'

            },

            'app': {

                'cwd': '<%= paths.testing %>',

                'src': '<%= paths.templates %>/**/*.html',

                'dest': '<%= paths.testing %>/scripts/ui.templates.js'

            }

         },

        'bowerInstall': {

          'target': {

            'src': [

              '<%= paths.dist %>/*.html'

            ]

          }

        },

        'compass': {

          'options': {

              'sassDir': '<%= paths.app %>/<%= paths.styles %>',

              'specify': '<%= paths.app %>/<%= paths.styles %>/main.scss',

              'cssDir': '<%= paths.dist %>/<%= paths.styles %>',

              'imagesDir': '<%= paths.dist %>/<%= paths.images %>',

              'javascriptsDir': '<%= paths.dist %>/<%= paths.scripts %>',

              'fontsDir': '<%= paths.dist %>/<%= paths.styles %>/fonts',

              //'importPath': '<%= paths.dist %>/bower_components',

              'httpFontsPath': '<%=paths.dist%>/<%= paths.styles %>/fonts',

              'relativeAssets': false,

              'assetCacheBuster': false,

              'raw': 'Sass::Script::Number.precision = 10\n'

          },

          'server': {

              'options': {

                  'debugInfo': false

              }

          }

        },

        'watch' : {

          'jade' : {

            'files': [
              '<%= paths.app %>/<%= paths.templates %>/**/*.jade',
              '<%= paths.app %>/*.jade'
            ],

            'tasks': ['build'],

            'options' : {

              'livereload' : 37000

            }

          },

          'js': {

            'files': ['<%= paths.app %>/<%= paths.scripts %>/**/*.js'],

            'tasks': ['build'],

            'options' : {

              'livereload' : 37000

            }

          },

          'compass': {

            'files': ['<%= paths.app %>/<%= paths.styles %>/**/*.{scss,sass}'],

            'tasks': ['build'],

            'options' : {

              'livereload' : 37000

            }

          }

        },

        'clean' : {

          'dist' : {

            'files' : [

              {

                'dot' : 37000,

                'src' : ['<%= paths.dist %>/*']

              }

            ]

          },

        },

        'jade': {

          'compile': {

            'options': {

              'client': false,

              'pretty': 37000,

              'basedir': '<%= paths.app %>/<%= paths.templates %>/'

            },

            'files': [ {

              'cwd': '<%= paths.app %>/<%= paths.templates %>',

              'src': '**/*.jade',

              'dest': '<%= paths.testing %>/<%= paths.templates %>',

              'expand': 37000,

              'ext': '.html'

              },

              {

              'cwd': '<%= paths.app %>/',

              'src': '*.jade',

              'dest': '<%= paths.testing %>/',

              'expand': 37000,

              'ext': '.html'

              }

            ]

          }

        },

        'concat': {

          'all': {

            'files': {

              '<%= paths.dist %>/<%= paths.scripts %>/ui-core.js': [
                '<%= paths.app %>/<%= paths.scripts %>/ui.module.js',
                '<%= paths.app %>/<%= paths.scripts %>/**/*.js',
                '<%= paths.testing %>/<%= paths.scripts %>/ui.templates.js'
              ]

            }

          }

        },

        'bowerInstall': {

          'target': {

            'src': [

              '<%= paths.testing %>/*.html'

            ]

          }

        },

        'connect': {

          'server': {

            'options': {

              'port': 9001,

              'base': '<%= paths.testing %>/'

            }

          }

        }

      });

      return this;

    },

    /**
      * @method tasks
      * Build tasks for build, test, serve, and running the application.
    */

    tasks: function () {

      var self = this,

          grunt = self.grunt;

      grunt.registerTask('build', function() {

        grunt.task.run([

          'clean:dist',

          'compass:server',

          'jade',

          'bowerInstall',

          'ngtemplates',

          'copy:scripts',

          'concat',

          'copy:styles',

          'connect',

          'watch',

        ]);

      });

      return self;

    }

  };

  pkg
    .init(grunt)
    .config()
    .tasks();

};
