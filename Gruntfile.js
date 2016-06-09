'use strict';

module.exports = function(grunt) {
  // we require path module to correctly concat paths
  var path = require('path');

  // measures the time each task takes
  require('time-grunt')(grunt);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),  // Parse package.json info
    projectparams: {   // These are the parameters for our project
      // README parameters
      readme_md_template: './README.md.template',
      readme_md_text_file: './README.md',
      readme_md_html_file: './README.md.html',
      // Directories that already exist
      src_dir: './src/',
      test_dir: './test/',
      unittests_dir: './test/unittests/',
      docs_dir: './docs/',
      dist_dir: './dist/',
      // Unittest output
      unittests_output_dir:'./test/output/',
      unittests_text_output_file: 'output.txt',
      unittests_browsertest_results_file: 'browser_tests_results.txt',
      unittests_coverage_report_file: 'coveragereport.html',
      // Browser tests to cover, this is a list of all the unittests
      // that should also be browser tested. It can accept wildcards.
      unittests_also_to_be_browsertested: ['./test/unittests/**/*.js'],
      unittests_browsertest_index_html_template: 'index.html.template',
      unittests_browsertest_index_html: 'index.html',
      // Final file
      output_file: '<%= pkg.name %>.<%= pkg.version %>.standalone.js',
      minimized_output_file: '<%= pkg.name %>.<%= pkg.version %>.standalone.min.js',
      banner_for_production: '/*! <%= pkg.name %>.<%= pkg.version %>.<%= grunt.template.today("h:MM:ss yyyy-mm-dd") %> */\n'
    },
    browserify: {
      standalone: {
        src: path.join('<%= projectparams.src_dir %>', '<%= pkg.name %>.js'),
        dest: path.join('<%= projectparams.dist_dir %>', '<%= projectparams.output_file %>'),
        options: {
          require: [
            [path.join('<%= projectparams.src_dir %>', '<%= pkg.name %>.js'), {expose: '<%= pkg.name %>'} ]
          ],
          banner: '<%= projectparams.banner_for_production %>',
          browserifyOptions: {
            standalone: '<%= pkg.name %>'
          }
        }
      },
      tests: {
        src: '<%= projectparams.unittests_also_to_be_browsertested %>',
        dest: path.join('<%= projectparams.unittests_output_dir %>',
                        'browserified_tests.js'),
        options: {
          // Embed source map for tests
          debug: true
        }
      }
    },
    // remove all previous browserified builds
    clean: {
      dist: [
        path.join('<%= projectparams.dist_dir %>', '/**/*'),
      ],
      tests: [
        path.join('<%= projectparams.unittests_output_dir %>', '/**/*'),
      ],
      docs: [
        '<%= projectparams.readme_md_html_file %>',
        '<%= projectparams.readme_md_text_file %>',
        path.join('<%= projectparams.docs_dir %>', '/**/*')]
    },
    // Start the basic web server from connect.
    connect: {
      server: {}
    },
    flow: {
      all: {
        options: {
          style: 'color'
        }
      }
    },
    'gh-pages': {
      options: {
        branch: 'gh-pages',
        base: 'docs'
      },
      publish: {
        options: {
          repo: 'https://github.com/tableau-mkt/wdcw.git',
          message: 'Published via gh-pages (cli)'
        },
        src: ['**/*']
      }
    },
    jscs: {
      src : [
        path.join('<%= projectparams.src_dir %>', '/**/*.js'),
        path.join('<%= projectparams.unittests_dir %>', '/**/*.js')
      ],
      options: {
        config: ".jscsrc",
        verbose: true, // If you need output with rule names http://jscs.info/overview.html#verbose
        fix: true // Autofix code style violations when possible.
      }
    },
    jsdoc: {
      all: {
        src: [
          path.join('<%= projectparams.src_dir %>', '/**/*.js'),
          path.join('<%= projectparams.unittests_dir %>', '/**/*.js')
        ],
        jsdoc: 'node_modules/.bin/jsdoc',
        options: {
          destination: '<%= projectparams.docs_dir %>',
          configure: './jsdoc.conf'
        }
      }
    },
    // jshint all the src files.
    jshint: {
      options: {
	eqeqeq: true,
	trailing: true
      },
      target: {
	src : [
          path.join('<%= projectparams.src_dir %>', '/**/*.js'),
          path.join('<%= projectparams.unittests_dir %>', '/**/*.js')
        ]
      }
    },
    markdown: {
      all: {
        src: '<%= projectparams.readme_md_text_file %>',
        dest: '<%= projectparams.readme_md_html_file %>'
      }
    },
    mochaTest: {
      test: {
        options: {
          captureFile: path.join('<%= projectparams.unittests_output_dir %>',
                                 '<%= projectparams.unittests_text_output_file %>'),
          reporter: 'tap',
          require: function(){
            var src_dir = path.resolve(grunt.config('projectparams.src_dir'));
            grunt.log.writeln('Coverage report is looking for source files under:' + src_dir);
            require('blanket')({
               // Only files that match the pattern will be instrumented
              pattern: src_dir
            });
          }
        },
        src: path.join('<%= projectparams.unittests_dir %>', '/**/*.js')
      },
      coverage: {
        options: {
          captureFile: path.join('<%= projectparams.unittests_output_dir %>',
                                 '<%= projectparams.unittests_coverage_report_file %>'),
          reporter: 'html-cov',
          // use the quiet flag to suppress the mocha console output
          quiet: true
        },
        src: path.join('<%= projectparams.unittests_dir %>' + '/**/*.js')
      }
    },
    // run the mocha tests in the browser via PhantomJS
    mocha_phantomjs: {
      all: {
        options: {
          reporter: 'tap',
          output: path.join('<%= projectparams.unittests_output_dir %>',
                              '<%= projectparams.unittests_browsertest_results_file %>'),
          urls: [
            path.join('http://127.0.0.1:8000/',
                      '<%= projectparams.unittests_output_dir %>',
                      '<%= projectparams.unittests_browsertest_index_html %>')
          ]
        }
      }
    },
    replace: {
      // Replace distribution related variables to produce README.md
      dist: {
        options: {
          patterns: [
            {
              json: {
                'unminimized_file': '<%= projectparams.output_file %>',
                'minimized_file': '<%= projectparams.minimized_output_file %>',
                'pkg_version': '<%= pkg.version %>'
              }
            }
          ]
        },
        src: '<%= projectparams.readme_md_template %>',
        dest: '<%= projectparams.readme_md_text_file %>'
      },
      browserified_tests_file: {
        options: {
          patterns: [
            {
              match: 'browserified_tests_js_file',
              replacement: path.normalize(path.join('/', '<%= browserify.tests.dest %>'))
            }

          ]
        },
        src: path.join('<%= projectparams.test_dir %>',
                       '<%= projectparams.unittests_browsertest_index_html_template %>') ,
        dest: path.join('<%= projectparams.unittests_output_dir%>',
                        '<%= projectparams.unittests_browsertest_index_html %>')
      }
    },
    uglify: {
      all: {
        files: [{
          src: path.join('<%= projectparams.dist_dir %>', '<%= projectparams.output_file %>'),
          dest: path.join('<%= projectparams.dist_dir %>', '<%= projectparams.minimized_output_file %>')
        }],
        options: {
          banner: '<%= projectparams.banner_for_production %>'
        }
      }
    },
    watch: {
      scripts: {
        files: path.join('<%= projectparams.src_dir %>', '/**/*.js'),
        tasks: ['docs', 'dist']
      }
    }
  });
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-flow');
  grunt.loadNpmTasks('grunt-gh-pages');
  grunt.loadNpmTasks("grunt-jscs");
  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.loadNpmTasks('grunt-markdown');
  grunt.loadNpmTasks('grunt-mocha-phantomjs');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-replace');
  // Aliases
  grunt.registerTask('browsertest', ['clean:tests', 'jshint', 'jscs', 'flow', 'browserify', 'replace:browserified_tests_file', 'connect', 'mocha_phantomjs']);
  grunt.registerTask('dist', ['clean:dist', 'browserify', 'uglify']);
  grunt.registerTask('docs', ['clean:docs', 'replace:dist', 'markdown', 'jsdoc']);
  grunt.registerTask('publish', ['docs', 'gh-pages:publish']);
  grunt.registerTask('localtest', ['clean:tests', 'jshint', 'jscs', 'flow', 'mochaTest']);
  grunt.registerTask('test', ['localtest', 'browsertest']);
  // Default task
  grunt.registerTask('default', ['browsertest', 'dist']);
};
