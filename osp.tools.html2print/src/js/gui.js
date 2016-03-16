

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