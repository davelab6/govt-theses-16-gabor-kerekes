

module.exports = function(grunt) {
    require('jit-grunt')(grunt);

    grunt.initConfig({
        less: {
            development: {
                options: {
                    optimization: 2
                },
                files: {
                    "css/main.css":  "less/main.less", // destination file and source file
                    "css/print.css": "less/print.less",
                    "css/print-debug.css": "less/print-debug.less",
                    "css/html2print.css": "print/osp.tools.html2print/html2print/less/html2print.less"
                }
            }
        },
        watch: {
            styles: {
                files: ['less/**/*.less', 'print/osp.tools.html2print/html2print/less/*.less'], // which files to watch
                tasks: ['less'],
                options: {
                    nospawn: true
                }
            }
        }
    });

    grunt.registerTask('default', ['less', 'watch']);
};