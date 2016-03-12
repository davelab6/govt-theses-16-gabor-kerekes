$(function() {

    // ________________________________ PREVIEW __________________________________ //
    $("#preview").click(function(e){
        e.preventDefault();
        $(this).toggleClass("button-active");
        $("html").toggleClass("preview normal");
    });

    // __________________________________ DEBUG __________________________________ //
    $("#debug").click(function(e){
        e.preventDefault();
        $(this).toggleClass("button-active");
        $("html").toggleClass("debug");
    });

    // __________________________________ SPREAD __________________________________ //
    $("#spread").click(function(e){
        e.preventDefault();
        $(this).toggleClass("button-active");
        $("html").toggleClass("spread");
    });

    // __________________________________ HIGH RESOLUTION __________________________________ //
    $("#hi-res").click(function(e){
        e.preventDefault();
        $(this).toggleClass("button-active");
        $("html").toggleClass("export");
        $("img").each(function(){
            var hires = $(this).attr("data-alt-src");
            var lores = $(this).attr("src");
            $(this).attr("data-alt-src", lores)
            $(this).attr("src", hires)
        });
        console.log("Wait for hi-res images to load");
        window.setTimeout(function(){
            console.log("Check image resolution");
            // Redlights images too small for printing
            $("img").each(function(){
                if (Math.ceil(this.naturalHeight / $(this).height()) < 3) {
                    console.log($(this).attr("src") + ": " + Math.floor(this.naturalHeight / $(this).height()) );
                    if($(this).parent().hasClass("moveable")) {
                        $(this).parent().toggleClass("lo-res");
                    } else {
                        $(this).toggleClass("lo-res");
                    }
                }
            });
        }, 2000);
    });


    // __________________________________ TOC __________________________________ //
    $(".paper").each(function(){
        var page = $(this).attr("id");
        $("#toc-pages").append("<li><a href='#" + page + "'>" + page.replace("-", " ") + "</a></li>")
    });

    $("#goto").click(function(e){
        e.preventDefault();
        $(this).toggleClass("button-active");
        $("#toc-pages").toggle();
    });
});





var H2P = (function(){

    var masterID = '#master-page';
    var init = function (url){



        function cleanContent(content){
            var container = $('<div>');
            content.find('.h2p-content').appendTo(container);
            return container;
        }



        return $.getJSON('print/printConfig.json').done(function(config){

            for(var i = 0; i < config['numPages']; i++){
                appendPage(masterID);
            }


            var contentwrapper = $('<div>').attr('id','content-source').appendTo('body');
            var dummy = $('<div>');
            dummy.load(url, function(){

                cleanContent($(this)).appendTo(contentwrapper);

                less.modifyVars(config.style);

                if(!isSafari()){
                    // disable scrolling, because it can interfere with polyfill
                    $('body').addClass('noScroll');

                    var onLayoutFinished = function(){
                        removeEmptyPages();
                        $('body').removeClass('noScroll');
                        console.log('layout complete');
                    };

                    less.pageLoadFinished.then(
                        function() {
                            initLayout( onLayoutFinished );
                        }
                    );
                }
            })
        });

    };

    function initLayout(onFinished){
        cssRegions.enablePolyfill();
        var f = document.getNamedFlow('contentflow');
        f.addEventListener('regionfragmentchange', function(event) {
            // validate the target of the event
            if(event.target !== f) { debugger; return; }
            onFinished();
        });
    }

    function isSafari(){
        var isSafari = navigator.userAgent.toLowerCase().indexOf("safari") > -1;
        var isChrome = navigator.userAgent.toLowerCase().indexOf("chrome") > -1;
        return !(isSafari && isChrome);
    }



    function updatePageIDs(){
        pages().each(function(i, page){
            $(page).attr('id', "page-"+i);
        });
    }

    function page(pageNum){
        return $("#page-" + pageNum);
    }

    function pages(){
        return $('#pages').children().not( $(masterID) );
    }

    function appendPage(masterID){
        var masterClone = $(masterID).clone().attr("id", "page-" + pages().length);
        masterClone.find('.body').addClass('content-target');
        return masterClone.appendTo( $('#pages') );
    }

    function setContentSource(container){
        var clone = container.clone();
        console.log(clone.find('.h2p-exclude'));
        clone.find('.h2p-exclude').remove();

        var content =  clone.get(0).outerHTML;
        localStorage.setItem('h2pContent', content);
    }

    //function getContentSource(){
    //    var content = $.parseHTML( localStorage.getItem('h2pContent') );
    //    var contentwrapper = $('<div>').attr('id','content-source');
    //    return $(contentwrapper).append(content);
    //}

    function removeEmptyPages(){
        var empty = $('.paper').filter(function(){
            return $(this).find('cssregion').children().length === 0;
        });

        empty.remove();
    }


    return{

        init: init,
        pages: pages,
        page: page,
        appendPage: appendPage,
        setContentSource: setContentSource,

        insertPageAfter: function (masterID, pageIndex) {
            var $page = $(masterID).clone().attr("id",  "page-" + pageIndex+1).insertAfter( page( pageIndex ) );
            updatePageIDs();
            return $page;
        },

        insertPageBefore: function (masterID, pageIndex) {
            var $page = $(masterID).clone().attr("id",  "page-" + pageIndex).insertBefore( page( pageIndex ) );
            updatePageIDs();
            return $page;
        }

    }

})();


