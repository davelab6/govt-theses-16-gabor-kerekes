

H2P.doAfterLayout( function(){

    var currentChapter = null;
    $('.paper').each(function(){

        var chapterHeading = $(this).find('.chapter-heading-wrapper');
        if(chapterHeading.length > 0){
            currentChapter = chapterHeading.find('h1').text();
        }

        if(currentChapter && chapterHeading.length === 0 && $(this).find('img').length === 0 ){
            var sideBar = $('<div>').addClass('sidebar');
            sideBar.append($('<div>').addClass('chapter-side-nav').text(currentChapter));
            $(this).append(sideBar);
        }
    });

});


