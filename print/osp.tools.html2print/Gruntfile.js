/**
 * Created by GaborK on 13/03/16.
 */



module.exports = function(grunt){
    require('jit-grunt')(grunt);

    // Project configuration.
    grunt.initConfig({
        concat: {
            options: {
                separator: ';'
            },
            dist: {
                src: [  'node_modules/less/dist/less.js',
                        'node_modules/css-regions-polyfill/bin/css-regions-polyfill.js',
                        'src/js/gui.js',
                        'src/js/html2print.js'
                ],

                dest: 'dist/js/html2print.js'
            }
        },

        less: {
            development: {
                files: {
                    "dist/less/html2print.less": "src/less/main.less"
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