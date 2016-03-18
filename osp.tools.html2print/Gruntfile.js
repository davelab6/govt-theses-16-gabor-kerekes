
module.exports = function(grunt){
    require('jit-grunt')(grunt);

    // Project configuration.
    grunt.initConfig({
        concat: {
            options: {
                separator: ';'
            },
            dist: {
                src: [
                        'src/js/html2print.js',
                        'src/js/gui.js'
                ],
                dest:   'dist/js/html2print.js'
            }
        },

        less: {
            development: {
                files: {
                    "dist/less/html2print.less":    "src/less/main.less",
                    "dist/css/outerUI.css":             "src/less/outerUI.less"
                }
            }
        },

        watch: {
            scripts: {
                files: ['src/js/*.js'],
                tasks: ['concat'],
                options: {
                    spawn: false
                }
            },

            styles:{
                files: ['src/less/*.less'],
                tasks: ['less'],
                options: {
                    spawn: false
                }
            }
        }
    });
};