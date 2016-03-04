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



/*
*
*
*   H2P singleton
*   provides interfaces to:
*       -insert pages
*
*
*
* */


var H2P = (function(){
    // ________________________________ INIT __________________________________ //
    // Creating crop marks
    (function init(){
        console.log("initializing H2P");

        masters().each(function(){
            var $master = $(this);
            $master.append(
                "<div class='crops'>" +
                "<div class='crop-top-left'>" +
                "<span class='bleed'></span>" +
                "</div>" +
                "<div class='crop-top-right'>" +
                "   <span class='bleed'></span>" +
                "</div>" +
                "<div class='crop-bottom-right'>" +
                "   <span class='bleed'></span>" +
                "</div>" +
                "<div class='crop-bottom-left'>" +
                "   <span class='bleed'></span>" +
                "</div>" +
                "</div>"
            );

            for(var i = 0; i<config.pages; i++){
                appendPage(config.defaultMasterID);
            }

            //need to remove recipient from master pages
            //otherwise part of the content will disappear in it once master page is hidden
            //$master.find('.content-target').removeClass('content-target');
            $master.attr("data-width", $(".paper:first-child").width());

        });
    })();


    function masters(){
        return $("[id*='master-page']");
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
        return $('#pages').children().not( masters() );
    }

    function appendPage(masterID){
        return $(masterID).clone().attr("id", "page-" + pages().length).appendTo( $('#pages') );
    }


    return{

        pages: pages,
        page: page,
        appendPage: appendPage,

        insertPageAfter: function (masterID, pageIndex) {
            var $page = $(masterID).clone().attr("id",  "page-" + pageIndex+1).insertAfter( page( pageIndex ) );
            updatePageIDs();
            return $page;
        },

        insertPageBefore: function (masterID, pageIndex) {
            var $page = $(masterID).clone().attr("id",  "page-" + pageIndex).insertBefore( page( pageIndex ) );
            updatePageIDs();
            return $page;
        },


    }

})();


