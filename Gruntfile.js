

module.exports = function(grunt) {
    require('jit-grunt')(grunt);

    grunt.initConfig({
        less: {
            development: {
                options: {
                    optimization: 2
                },
                files: {
                    "css/main.css":  "less/main.less",
                    "css/print.css": "less/print.less",
                    "css/h2p-ui.css": "less/h2p-ui.less"
                }
            }
        },
        watch: {
            styles: {
                files: ['less/**/*.less'],
                tasks: ['less'],
                options: {
                    nospawn: true
                }
            }
        }
    });

    grunt.registerTask('default', ['less', 'watch']);
};