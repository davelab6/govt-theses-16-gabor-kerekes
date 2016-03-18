var H2P = (function () {


    var userConfigPath = 'h2p_config.json';

    // things that will be hackily loaded into the iframe
    var dirName = 'osp.tools.html2print/';

    // getting script location, to know where h2p resources is located
    var dirPath = document.currentScript.src.split(dirName)[0] + dirName;
    var libPaths = [    dirPath + 'lib/css-regions-polyfill/bin/css-regions-polyfill.js',
                        dirPath + 'lib/less/dist/less.min.js'
    ];



    //  style that goes inside the iframe
    //  defines the setup of paper, pages etc.
    var innerStylePath = dirPath + 'dist/less/html2print.less';

    //  style that goes outside the iframe, in the parent document
    //  defines the look of the toolbar and size/positioning of iframe
    var outerStylePath = dirPath + 'dist/css/outerUI.css';

    // ui components html
    var uiComponentsPath = dirPath + 'dist/html/h2p.html';


    var userConfig = null;
    var iFrame = null;
    var masterPage = null;

    var isInitialized = false;


    // check for JQUERY
    if(!('jQuery' in window)){
        showError(new Error('jQuery should be linked before html2print'));
        return;
    }

    // a delegate object that will live inside the iFrame
    // and can be given tasks to do when the layout is done
    var H2PDelegate = (function(){

        var tasks = [];

        function consumeTasks(){
            while(tasks.length > 0){
                tasks.shift().call();
            }
        }

        function doAfterLayout(task){
            tasks.push(task);
        }

        return {
            consumeTasks: consumeTasks,
            doAfterLayout: doAfterLayout
        }

    })();




    //preload config file
    var userConfigLoaded = (function loadUserConfig() {
        return new Promise(function (resolve, reject) {
            $.getJSON(userConfigPath)
                .done(function (userConfig) {

                    // convert this to boolean first
                    userConfig['pages']['mirror'] = (userConfig['pages']['mirror'] === "true");
                    resolve(userConfig);
                })
                .fail(function (xhr, status, err) {
                    var msg = 'Cannot find config file at ' + userConfigPath;
                    reject(msg + ", " + xhr + " " + status + " " + err);
                })
        });
    }()).then(function(config) {

        userConfig = config;
        if( window.location.hash === userConfig['route'] ){
            init();
        }

        //for forward button
        window.addEventListener('hashchange', function(){
            if(location.hash === userConfig['route'] && !isInitialized){
                init();
            }
        });
    });


    // load UI components from h2p.html
    function loadUIComponents(){
        return new Promise(function(resolve, reject){
            $.get(uiComponentsPath)
                .done(function(html){
                    resolve($.parseHTML(html));
                }).fail(function(){
                reject();
            });
        });
    }

    // add ui components and stylesheets to the document
    function buildOuterUI(uiElements){
        function getElementByID(id){ $.grep(uiElements, function(e){ return e.id === id })  };

        masterPage = getElementByID('master-page');
        var toolbar = getElementByID('h2p-toolbar' );
        $(toolbar).addClass('hidden');

        var spinner = getElementByID('h2p-loading-spinner');
        var outerUIStyle = createStyleElement(outerStylePath).attr('id', 'h2p-ui-style');
        $('head').append(outerUIStyle);

        // check for user defined gui stylesheet
        if(userConfig['styles']['ui-override']){
            createStyleElement(userConfig['styles']['ui-override'])
                .attr('id', 'h2p-ui-style-override')
                .insertAfter(outerUIStyle);
        }
        $('body').append([  $(toolbar), $(spinner)   ]);
    }




    function initToolbar(){
        $('#h2p-toolbar').removeClass('hidden');
        var doc = $(iFrame).contents().find("html");
        $(doc).addClass('normal');


        $('#preview-checkbox input').change(function() {
            if($(this).is(":checked")) {
                doc.addClass("preview");
                doc.removeClass("normal");
            } else {
                doc.removeClass("preview");
                doc.addClass("normal");
            }
        });

        $("#debug-checkbox input").change(function() {
            if($(this).is(":checked")) {
                doc.addClass("debug");
            } else {
                doc.removeClass("debug");
            }
        });

        $("#spread-checkbox input").change(function() {
            if($(this).is(":checked")) {
                doc.addClass("spread");
            } else {
                doc.removeClass("spread");
            }
        });


        function applyZoom(level){
            doc.find("#pages").css({
                "-webkit-transform": "scale(" + level + ")"
                //"-webkit-transform-origin": "0 0"
            });
        }


        $("#zoom-level input").change(function() {
            var zoomLevel = $(this).val() / 100;
            applyZoom(zoomLevel);
        });


        $("#page-selector input").change(function() {
            var pageNumber = $(this).val() - 1;

            var target = doc.find('.paper:eq(' + pageNumber + ')');
            var offsetTop = target.offset().top;

            doc.find('body').scrollTop(offsetTop);
        });

        $("#print-button").on('click', function() {
            applyZoom(1);
            $(iFrame).get(0).contentWindow.print();
        });
    }


    function createStyleElement(href){
        return $('<link>').attr({
            'href': href,
            'rel': 'stylesheet',
            'type': 'text/css',
            'charset': 'utf-8'
        });
    }

    function createScriptElement(src){
        return  $('<script>').attr(
                {
                    'type':  "text/javascript",
                    'src': src
                });

    }

    // create script elements pointing to H2P's dependencies
    function getLibs() {
        var scripts = [];
        libPaths.forEach(function (lib) {
            scripts.push( createScriptElement(lib));
        });
        return scripts;
    }


    // creat script elements from sources defined in the config file
    function getUserScripts(){
        return userConfig['scripts'].map(function(src){ return createScriptElement(src)  });
    }


    //  return link elements referring to the innerUIStyles
    //  and the page settings defined in the h2pConfig file
    function getInnerStyles(){
        return  [
            createStyleElement(innerStylePath).attr('rel', 'stylesheet/less'),
            createStyleElement(userConfig['styles']['print'])
        ];
    }

    // get user-defined content from the source document
    function getContent() {
        var content = $('.h2p-content').clone();
        content.find('.h2p-exclude').remove();
        var contentWrapper = $('<div>').attr('id', 'content-source').append(content);
        return $(contentWrapper).append(content);
    }

    // create a page based on the master page element defined in h2p.html
    function createPage(pageNum) {
        var masterClone = $(masterPage)
            .clone()
            .attr("id", "page-" + pageNum);
        masterClone.find('.body').addClass('content-target');
        return masterClone;
    }


    function createPages(num) {
        var pages = $('<div>').attr('id', 'pages');
        for (var i = 0; i < num; i++) {
            createPage(i).appendTo(pages);
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

    function buildIFrame() {

        var iFrameBody = buildIFrameBody(
            [
                getInnerStyles(),
                getLibs(),
                getContent(),
                getUserScripts(),
                createPages(userConfig['pages']['count'])
            ]
        );

        var _iFrame = $('<iframe>').attr('id', 'h2p-viewport').appendTo('body').get(0);
        var doc = _iFrame.contentWindow.document;
        _iFrame.contentWindow.cssRegionsManualTrigger = true;
        _iFrame.contentWindow.H2P = H2PDelegate;

        doc.open();
        doc.write(iFrameBody.html());
        doc.close();

        return new Promise(function(resolve){
            $(_iFrame).load(function(){
                iFrame = _iFrame;
                resolve()
            });
        });
    }

    // this will trigger less to recompile styles with the custom page config variables
    // returns a promise that resolves when compilation is finished
    function applyPageConfig(){

        if(userConfig['pages']['mirror']){
            $(iFrame).contents().find('#pages').addClass('mirrored');
        }


        var configCopy = JSON.parse(JSON.stringify(userConfig));

        // remove entries that should not be forwarded to less.js
        delete configCopy['pages']['mirror'];
        delete configCopy['pages']['count'];

        // forward configs to less
        return iFrame.contentWindow.less.modifyVars(userConfig['pages']);
    }

    //  removes pages that were left empty
    function removeEmptyPages() {
        var empty = $(iFrame.contentWindow.document).find('.paper').filter(function () {
            return $(this).find('cssregion').children().length === 0;
        });
        empty.remove();
    }

    // tasks to be done before layout process starts
    function onBeforeLayout(){
        // have to temporarily disable scroll, because scrolling interferes with CSSRegions' work
        $(iFrame).contents().find('body').addClass('noScroll');
    }


    //  returns a promise that resolves when CSSRegions is done
    function waitForLayoutToFinish() {
        var flow = iFrame.contentWindow.document.getNamedFlow('contentflow');
        return new Promise(function(resolve){


            // CSSRegions will emit this event when it's finished with the layout process
            flow.addEventListener('regionfragmentchange', function (event) {
                // validate the target of the event
                if (event.target !== flow) {
                    return;
                }

                H2PDelegate.consumeTasks();

                //  in case H2P delegate is given a task that alters the shape/size of the content,
                //  CSSRegions will restart the layout process so we have to
                //  wait for it to really finish
                var wait = setInterval(function(){
                    var isFlowFinished = !flow.relayoutInProgress && !flow.relayoutScheduled;
                    if(isFlowFinished){
                        resolve();
                        clearInterval(wait);
                    }
                }, 100);
            });
        });
    }


    // tasks to be executed when layout is done
    function onAfterLayout() {
        removeEmptyPages();
        var spinner = $('#h2p-loading-spinner').addClass('hidden');
        initToolbar();
        $(iFrame).contents().find('body').removeClass('noScroll');
        setTimeout(function () {
            spinner.remove();
        }, 2050);
    }


    function showError(err){
        var messageContainer = document.createElement('div');
        messageContainer.textContent = 'Oops, something broke:';

        var errorContainer = document.createElement('div');
        errorContainer.textContent = err.stack;

        var wrapper = document.createElement('div');
        wrapper.className = 'h2p-error-message';
        wrapper.appendChild(messageContainer);
        wrapper.appendChild(errorContainer);


        var body = document.getElementsByTagName('body')[0];
        body.className = 'h2p-error';
        body.innerHTML = "";
        body.appendChild(wrapper);
    }

    function remove(){
        $('#h2p-viewport').remove();
        $('#h2p-loading-spinner').remove();
        $('#h2p-toolbar').remove();
        $('#h2p-ui-style').remove();
        $('html').css('overflow-y', 'initial');
        if(location.hash === userConfig['route'] ) {
            history.replaceState({}, document.title, ".");
        }
        window.removeEventListener('popstate', remove);
        isInitialized = false;
    }

    function init(){

        isInitialized = true;
        window.location.hash = userConfig['route'];
        $('html').css('overflow-y', 'hidden');

        userConfigLoaded
            .then(loadUIComponents)
            .then(buildOuterUI)
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

        //when backbutton is pressed, remove all h2p things
        window.addEventListener('popstate', remove);
    }


    return {
        init: init,
        remove: remove,
        isInitialized: function(){
            return isInitialized;
        }
    }

})();