
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
                        'lib/jquery/dist/jquery.js',
                        'src/js/html2print.js'
                ],
                dest:   'dist/js/html2print.js'
            }
        },

        less: {
            development: {
                files: {
                    "dist/less/html2print.less":    "src/less/main.less",
                    "dist/css/gui.css":             "src/less/gui.less"
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
                files: ['src/less/*.less'], // which files to watch
                tasks: ['less'],
                options: {
                    spawn: false
                }
            }
        }
    });
};