$(function() {
    $('iframe').load(function() {
        var doc = $("iframe").contents().find("html");

        $('[name="preview"]').change(function() {
            if($(this).is(":checked")) {
                doc.addClass("preview");
                doc.removeClass("normal");
            } else {
                doc.removeClass("preview");
                doc.addClass("normal");
            }
        });

        $('[name="debug"]').change(function() {
            if($(this).is(":checked")) {
                doc.addClass("debug");
            } else {
                doc.removeClass("debug");
            }
        });

        $('[name="spread"]').change(function() {
            if($(this).is(":checked")) {
                doc.addClass("spread");
            } else {
                doc.removeClass("spread");
            }
        });



        function applyZoom(level){
            doc.find("#pages").css({
                "-webkit-transform": "scale(" + level + ")",
                "-webkit-transform-origin": "0 0"
            });
        }

        var prevZoom = localStorage.getItem('H2PZoom');
        if(prevZoom){
            $('[name="zoom"]').val(prevZoom*100);
            applyZoom(prevZoom);
        }

        $('[name="zoom"]').change(function() {
            var zoomLevel = $(this).val() / 100;
            localStorage.setItem('H2PZoom', zoomLevel);
            applyZoom(zoomLevel);
        });


        $('[name="page"]').change(function() {
            var pageNumber = $(this).val() - 1;

            var target = doc.find('.paper:eq(' + pageNumber + ')');
            var offsetTop = target.offset().top;

            doc.find('body').scrollTop(offsetTop);
        });

        $("#print").on('click', function() {
            $("iframe").get(0).contentWindow.print();
        });
    });
});


var H2P = (function () {

    var masterID = '#master-page';
    var printConfigUrl = 'print/printConfig.json';
    var beforeLayoutTasks = [];
    var afterLayoutTasks = [];


    function beforeLayout(tasks){
        if(typeof tasks === 'function'){
            tasks = [tasks];
        }
        beforeLayoutTasks = beforeLayoutTasks.concat(tasks);
        return self;
    }

    function afterLayout(tasks){
        if(typeof tasks === 'function'){
            tasks = [tasks];
        }
        afterLayoutTasks = afterLayoutTasks.concat(tasks);
        return self;
    }


    var init = function (url) {

        function loadContent(){
            return new Promise(function(resolve, reject){
                var content = $('<div>');
                content.load(url, function (response, status, xhr) {
                    if ( status == "error" ) {
                        var msg = "Something went wrong with loading content from " + url;
                        var err = msg + " " + xhr.status + " " + xhr.statusText;
                        reject(err);
                    }
                    resolve(content);
                });
            });
        }


        function cleanContent(c) {
            var content = c.find('.h2p-content');
            content.find('.h2p-exclude').remove();
            return $('<div>').append(content);
        }

        function createPages(num){
            for (var i = 0; i < num; i++) {
                appendPage(masterID);
            }
        }

        function fetchPrintConfig(){
            return new Promise(function(resolve, reject){
                $.getJSON(printConfigUrl)
                    .done(function(printConfig){
                        resolve(printConfig);
                    })
                    .fail(function(xhr, status, err){
                        var msg = 'Cannot find config file at ' + printConfigUrl;
                        reject(msg + ", " + xhr + " " + status + " " + err);
                    })
            });
        }

        function registerAfterLayoutTasks(){
            var f = document.getNamedFlow('contentflow');
            f.addEventListener('regionfragmentchange', function (event) {
                // validate the target of the event
                if (event.target !== f) {
                    debugger;
                    return;
                }

                afterLayoutTasks.forEach(function (task) {
                    task.call();
                });
            })
        }



        // have to disable scroll, because scrolling can interfere with CSSRegions lib's work
        $('body').addClass('noScroll');


        // H2P's own tasks to be executed when layout is done
        var afterLayout = function(){
            removeEmptyPages();
            $('body').removeClass('noScroll');
            $('#loading-spinner').addClass('hidden');
            setTimeout(function(){
                $('#loading-spinner').remove();
            }, 2050);
        };

        // adding these to the top of the list
        beforeLayoutTasks.unshift(beforeLayout);
        afterLayoutTasks.unshift(afterLayout);

        // need to delay this otherwise the requests would delay the appearance of the loading indicator
        setTimeout(function(){

            // start
            loadContent()
                .then(function(cnt){

                    var content = cleanContent(cnt);
                    var contentWrapper = $('<div>').attr('id', 'content-source')
                        .append(content);

                    contentWrapper.appendTo('body');

                    fetchPrintConfig().then(function(config){

                        createPages(config['numPages']);

                        beforeLayoutTasks.forEach(function(task){
                            task.call();
                        });

                        // this will trigger less to recompile styles with the custom page config variables
                        less.modifyVars(config.style);
                        registerAfterLayoutTasks();

                    }).catch(function(err){
                        alert(err);
                    });

                }).catch(function(err){
                alert(err);
            });

        }, 1);

    };



    function updatePageIDs() {
        pages().each(function (i, page) {
            $(page).attr('id', "page-" + i);
        });
    }

    function page(pageNum) {
        return $("#page-" + pageNum);
    }

    function pages() {
        return $('#pages').children().not($(masterID));
    }

    function appendPage(masterID) {
        var masterClone = $(masterID).clone().attr("id", "page-" + pages().length);
        masterClone.find('.body').addClass('content-target');
        return masterClone.appendTo($('#pages'));
    }


    function removeEmptyPages() {
        var empty = $('.paper').filter(function () {
            return $(this).find('cssregion').children().length === 0;
        });

        empty.remove();
    }


    // the interface to H2P
    var self = {

        init: init,
        pages: pages,
        page: page,
        appendPage: appendPage,
        beforeLayout: beforeLayout,
        afterLayout: afterLayout,

        insertPageAfter: function (masterID, pageIndex) {
            var $page = $(masterID).clone().attr("id", "page-" + pageIndex + 1).insertAfter(page(pageIndex));
            updatePageIDs();
            return $page;
        },

        insertPageBefore: function (masterID, pageIndex) {
            var $page = $(masterID).clone().attr("id", "page-" + pageIndex).insertBefore(page(pageIndex));
            updatePageIDs();
            return $page;
        }

    };

    return self;

})();


