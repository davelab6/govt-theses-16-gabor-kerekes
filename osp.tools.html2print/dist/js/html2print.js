(function () {

    var masterID = '#master-page';
    var printConfigUrl = 'printConfig.json';

    // things that will be hackily loaded into the iframe
    var dirName = 'osp.tools.html2print/';
    var dirPath = document.currentScript.src.split(dirName)[0] + dirName;
    var libPaths = [    dirPath + 'lib/css-regions-polyfill/bin/css-regions-polyfill.js',
                        dirPath + 'lib/less/dist/less.min.js'
                    ];
    var h2pStylePath = dirPath + 'dist/less/html2print.less';

    var userConfig = null;
    var iFrame = null;


    function loadPrintConfig() {
        return new Promise(function (resolve, reject) {
            $.getJSON(printConfigUrl)
                .done(function (printConfig) {
                    resolve(printConfig);
                })
                .fail(function (xhr, status, err) {
                    var msg = 'Cannot find config file at ' + printConfigUrl;
                    reject(msg + ", " + xhr + " " + status + " " + err);
                })
        });
    }
    //loading content this way, instead of an iframe, because it's difficult to reset css in an iframe
    function loadContent() {
        return new Promise(function (resolve, reject) {
            var content = $('<div>');
            content.load(userConfig['document'], function (response, status, xhr) {
                if (status == "error") {
                    var msg = "Something went wrong with loading content from " + url;
                    var err = msg + " " + xhr.status + " " + xhr.statusText;
                    reject(err);
                }

                resolve(content);
            });
        });
    }

    function cleanContent(c) {
        //cannot find excludes even though they're there
        //console.log(c.find('.h2p-exclude').length);
        var content = c.find('.h2p-include');
        content.find('.h2p-exclude').remove();
        var contentWrapper = $('<div>').attr('id', 'content-source').append(content);
        return $(contentWrapper).append(content);
    }


    function getScripts() {
        var scripts = [];
        libPaths.forEach(function (lib) {
            scripts.push(

                $('<script>').attr(
                {   'type':  "text/javascript",
                    'src': lib
                })

            )
        });
        return scripts;
    }

    function getStyles(){
        var linkElem =  $('<link>').attr({
                            'rel': 'stylesheet/less',
                            'media': 'all',
                            'charset': 'utf-8'
                        });

        return  [
                    linkElem.attr('href', h2pStylePath),
                    linkElem.clone().attr('href', userConfig['style'])
                ];
    }

    function createPage(masterID, pageNum) {
        var masterClone = $(masterID)
            .clone()
            .attr("id", "page-" + pageNum);
        masterClone.find('.body').addClass('content-target');
        return masterClone;
    }


    function createPages(num) {
        var pages = $('<div>').attr('id', 'pages');
        for (var i = 0; i < num; i++) {
            createPage(masterID, i).appendTo(pages);
        }
        return pages;
    }

    function buildIFrameBody(elements){
        var body = $('<body>');
        elements.forEach(function(element){
            if(element.constructor === Array){
                element.forEach(function(el){
                    el.appendTo(body);
                })
            } else {
                element.appendTo(body);
            }
        });
        return body;
    }

    function buildIFrame( content ) {

        var body = buildIFrameBody(
                    [
                        getStyles(),
                        getScripts(),
                        cleanContent(content),
                        createPages(userConfig['pages']['count'])
                    ]
        );

        var _iFrame = $('<iframe>').attr('id', 'viewport').prependTo('body').get(0);
        var doc = _iFrame.contentWindow.document;
        _iFrame.contentWindow.cssRegionsManualTrigger = true;
        doc.open();
        doc.write(body.html());
        doc.close();

        return new Promise(function(resolve){
            $(_iFrame).load(function(){
                iFrame = _iFrame;
                resolve()
            });
        });
    }

    // this will trigger less to recompile styles with the custom page config variables
    // returns a promise
    function applyPageConfig(){

        if(userConfig['pages']['mirror'] === true){
            $(iFrame).contents().find('#pages').addClass('mirrored');
        }

        // remove entries that should not be forwarded to less.js
        delete userConfig['pages']['mirror'];
        delete userConfig['pages']['count'];

        // forward configs to less
        return iFrame.contentWindow.less.modifyVars(userConfig['pages']);
    }

    //  trims pages at when layout is done
    function removeEmptyPages() {
        var empty = $(iFrame.contentWindow.document).find('.paper').filter(function () {
            return $(this).find('cssregion').children().length === 0;
        });
        empty.remove();
    }


    //  subscribes to 'regionfragmentchange' event of CSSRegions,
    //  which signals the end of the layout process
    //  returns a promise that resolves when CSSRegions is done
    function waitForLayoutToFinish() {
        var flow = iFrame.contentWindow.document.getNamedFlow('contentflow');
        return new Promise(function(resolve){
            flow.addEventListener('regionfragmentchange', function (event) {
                // validate the target of the event
                if (event.target !== flow) {
                    return;
                }
                resolve();
            });
        });
    }


    // tasks to be done before layout process starts
    function onBeforeLayout(){
        // have to temporarily disable scroll, because scrolling interferes with CSSRegions' work
        $(iFrame).contents().find('body').addClass('noScroll');
    }


    // tasks to be executed when layout is done
   function onAfterLayout () {
       var layoutReady = new Event('layoutReady');
        document.dispatchEvent(layoutReady);
        iFrame.contentWindow.document.dispatchEvent(layoutReady);
        removeEmptyPages();
        var spinner = $('#loading-spinner').addClass('hidden');
        $(iFrame).contents().find('body').removeClass('noScroll');
        setTimeout(function () {
            spinner.remove();
        }, 2050);
    }


    function showError(err){
        var messageContainer = $('<div>').text('Oops, something is not right: ');
        var errorContainer = $('<div>').text(err.stack);
        var container = $('<div>').addClass('h2p-error-message').append([messageContainer, errorContainer]);
        $('body').empty().addClass('h2p-error').append(container);
    }


    // need to delay this otherwise the requests would delay the appearance of the loading indicator
    setTimeout(function () {
        loadPrintConfig()
            .then(function (conf) {
                userConfig = conf;
                return loadContent();
            })
            .then(buildIFrame)
            .then(function(){
                onBeforeLayout();
                return applyPageConfig();
            })
            .then(function(){
                iFrame.contentWindow.cssRegions.enablePolyfill();
                return waitForLayoutToFinish();
            })
            .then(onAfterLayout)
            .catch(function (err) {
                showError(err);
            });
    }, 1);

})();


;

(function(){

    $('#toolbar').addClass('hidden');
    var doc = $('iframe').contents().find("html");

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
        applyZoom(1);
        $("iframe").get(0).contentWindow.print();
    });

    document.addEventListener('layoutReady', function(){
       $('#toolbar').removeClass('hidden');
    });

})();