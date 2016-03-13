/**
 * Created by GaborK on 21/01/16.
 */

$(function(){


    function loadContent(){
        var htmlcontent = [];
        var jqxhr = null;
        [
            "0_abstract.html",
            "1_introduction–the-world-as-text.html",
            "2_literacy-and-power.html",
            "3_designer-as-agent.html",
            "4_software-as-policy.html",
            "5_interfaces.html",
            "6_the-world-as-process.html",
            "7_conclusion.html"

        ].forEach(function(title, index){
            jqxhr = $.get('content/html/'+title, function(data){
                htmlcontent[index] = data;
            });
        });

        jqxhr.done(function(){
            htmlcontent.forEach(function(content){
                var c = $(content);
                //fix image sources
                c.find('img').each(function(){
                    var src = $(this).attr('src');
                    var splitSrc = src.split("/");
                    var fname = splitSrc[splitSrc.length-1];
                    $(this).attr('src', 'content/imgs/'+fname);
                });
                $('#content').append(c);
            });
        });

        return jqxhr;
    }


    function buildIndexModel(){
        var ignoreTags = ['citation'];
        var index = {
            snippets: [],
            tags: []
        };

        var tagCounts = {};

        $('#content').find('span').each(function(){

            var span = $(this);

            var tags = span.attr('class').split(" ")
                .filter(function(tag){
                    return ignoreTags.indexOf(tag) === -1;
                });

            if(tags.length){
                index['snippets'].push(
                    {
                        text: span.text(),
                        tags: tags
                    }
                );

                tags.forEach(function(tag){
                    if(!(tag in tagCounts)){
                        tagCounts[tag] = 1;
                    }  else {
                        tagCounts[tag] ++;
                    }
                });
            }
        });

        Object.keys(tagCounts).forEach(function(tag){
           index['tags'].push(
               {
                   count: tagCounts[tag],
                   text: tag
               }
           )
        });

        // http://stackoverflow.com/questions/1129216/sort-array-of-objects-by-string-property-value-in-javascript
        function compare(a,b) {
            if (a.text < b.text)
                return -1;
            else if (a.text > b.text)
                return 1;
            else
                return 0;
        }

        index.tags.sort(compare);

        index['getSnippetsForTags'] = function(tags){
           return this.snippets.filter(function(snippet){
                return intersect(tags, snippet.tags).length == tags.length;
           });
        };

        index['getTagsForSnippets'] = function(snippets){
            var tags = [];
            snippets.forEach(function(snippet){
               snippet.tags.forEach(function(tag){
                    if(tags.indexOf(tag) == -1){
                        tags.push(tag);
                    }
               });
            });
            return tags;
        };


        return index;
    }


    function buildIndexView(model){

        function showSnippets(snippets){
            snippets.forEach(function(snippet, index){
                var container = $('<div>').addClass('snippet-container').appendTo('#index-snippets');
                $('<div>').text(index+1 +"/" + snippets.length).addClass('snippet-index').appendTo(container);
                $('<div>').text(snippet.text).addClass('snippet').appendTo(container);
            });
        }

        // display tags
        // gonna make columns manually because the css solution doesn't look good
        var tagColumn = null;
        model.tags.forEach(function(tag, index){
            if(index % 10 == 0 && index != model.tags.length - 1){
                tagColumn = $('<div>').addClass('tagColumn');
            }
            $('<div>').text(tag.text).addClass('tag selectable').appendTo(tagColumn);
            $('#index-tags-selection').append(tagColumn);
        });


        $('.tag.selectable').click(function(){

            // don't know why the selector above is not working properly...
            // still returns false for hasClass selectable if non-selectable is clicked...
            if($(this).hasClass('selectable')){
                $(this).toggleClass('selected');
                $('#index-tags-selected').empty();

                var selectedTags = $('.tag.selected').get().map(function(elem){
                    var text = $(elem).text();
                    $('#index-tags-selected').append($('<span>').text(text));
                    return $(elem).text();
                });


                $('.snippet-container').remove();

                if(selectedTags.length){
                    var snippets = model.getSnippetsForTags(selectedTags);
                    var selectableTags = model.getTagsForSnippets(snippets);

                    $('.tag.selectable').each(function(){
                        if((selectableTags.indexOf($(this).text()) == -1)){
                            $(this).removeClass('selectable');
                        }
                    });

                    showSnippets(snippets);

                    var sentenceFound = false;
                    var sentence = "";
                    var i = 100;
                    while(!sentenceFound){
                         sentence = snippets[Math.floor(Math.random()*snippets.length)]
                                .text.split(" ").slice(0, 8).join(" ") +"...";
                         if(sentence.length<60 || i > 100){
                             sentenceFound = true;
                         }
                    }


                    $('#index-snippets-preview').text(sentence);

                } else {
                    $('.tag').addClass('selectable');
                    $('#index-snippets-preview').text("");
                }
            }

        });



        $('#index-tags-wrapper').click(function(e){
            $("#index-snippets-wrapper").addClass('rel');
            $("#index-snippets").addClass('hidden');
            $("#index-snippets-preview").removeClass('hidden');
            $(this).removeClass('highlight');
            $('#index-tags-selected').hide();

            $(this).animate({
                    height: 70 +'vh'
                }, 300, function(){
                    $(this).addClass('active');
                    $('#index-tags-selection').fadeIn(200);
                    $("#index-tag-control").show();
            });
            $('#index-snippets-wrapper').removeClass('active');
        });

        $('#index-tags-wrapper').mouseleave(function(){
           $(this).removeClass('highlight');
        });

        $('#index-tags-wrapper').mouseenter(function(){
            if(!$(this).hasClass('active')){
                $(this).addClass('highlight');
            }
        });




        $('#index-reset').click(function(){
            $('#index-snippets').empty();
            $('#index-tags-selected').empty();
            $('.tag').addClass('selectable');
            $('.tag.selected').removeClass('selected');
            $('#index-snippets-preview').text('');
        });


        $('#index-snippets-wrapper').mouseenter(function(){
            if(!$(this).hasClass('active') && $('.tag.selected').length > 0){
                $(this).addClass('highlight');
            }
        });

        $('#index-snippets-wrapper').mouseleave(function(){
            $(this).removeClass('highlight');
        });

        $("#index-snippets-wrapper").click(function(e){
            var tagsWrapper =  $('#index-tags-wrapper');
            if($('.tag.selected').length > 0){
                $(this).addClass('active');
                $(this).removeClass('highlight');
                $("#index-snippets-preview").addClass('hidden');
                $("#index-snippets").removeClass('hidden');
                $("#index-snippets-wrapper").removeClass('rel');
                $('#index-tags-selection').hide();
                $('#index-tags-selected').show();
                $("#index-tag-control").hide();
                tagsWrapper.animate({
                    height: 10 +'vh'
                }, 300 , function(){
                    $('#index-tags-wrapper').removeClass('active');
                });
            }
        });
    }

    function removeEmptyReferenceBlocks(){
        $('.references').each(function(){
            if($(this).children().length == 0){
                $(this).remove();
            }
        });
    }

    function fixReferences(){
        $('.references').each(function(){
            var list = $('<ol>').addClass('ref-temp');
            $(this).children().each(function(){
                var id = $(this).attr('id');
                var listItem = $('<li>').attr('id', id);
                var html = $(this).find('p').first().html();
                listItem.html( html.substring(3, html.length) );
                listItem.appendTo(list);
            });
            list.insertBefore(this);
            $(this).remove();
        });

        $('.ref-temp').each(function(){
           $(this).removeClass('.ref-temp');
            $(this).addClass('references');
        });
    }


    function fixImages(){
         $('*').filter(function(){
           return $(this).children('img').length > 0;
         }).each(function(){
             var oldContainer = $(this);
             $(this).find('img').each(function(){
                 var newContainer = $('<div>').addClass('image-container');
                 $(this).appendTo(newContainer);
                 newContainer.insertAfter(oldContainer);

                 var splitSrc = $(this).attr('src').split('/');
                 var baseName = splitSrc[splitSrc.length-1].split('.')[0];
                 newContainer.attr('id', baseName);
             });
             $(oldContainer).remove();
         });
    }


    function initMenu(){

        var nav = $('header nav');
        nav.mouseenter(function(){
           $(this).find('a').removeClass('hidden');
        });

        nav.mouseleave(function(){
           $(this).find('a').not('#title-nav').addClass('hidden');
        });

        $('#index-nav').click(function(){
             $('body').css('overflow-y', 'hidden');
            $('.maintitle').hide();
             $('#index').slideDown(150, function(){
                 $(this).removeClass('hidden');
             });
            $('header').addClass('dark');
        });

        $('#title-nav').click(function(){
           if( $('#index').hasClass('hidden') ){
               return;
           }
            $('#index').slideUp(150, function(){
                $(this).addClass('hidden');
                $('body').css('overflow-y', 'auto');
            });
            $('.maintitle').show();
            $('header').removeClass('dark');
        });

        $('#print-nav').click(function(){
            window.location = "../print.html"
        });



    }





    function distortTitle(){
        $(document).scroll(function(e){
            var sctop = $(document).scrollTop();
            if($(document).scrollTop() < window.innerHeight){
                var stretch = sctop.map(0, window.innerHeight, 1, 100);
                console.log(sctop, stretch);
                $('.maintitle').css({
                    'transform': 'scale(1, ' +stretch +')',
                    'top': -stretch*10 +'px',
                });
            }
        });
    }




    loadContent().done(function(){

        var indexModel  = buildIndexModel();
        buildIndexView(indexModel);
        removeEmptyReferenceBlocks();
        fixReferences();
        fixImages();
        initMenu();
        //distortTitle();
        //createMap();
    });


    function createMap(){

        var oldHeight = $('#content').height();
        var contentClone = $('#content').clone();
        var newHeight = oldHeight.map(0, oldHeight, 0, window.innerHeight*5);
        var ratio = newHeight/oldHeight;


        $('#map').css({
            zoom: 0.7,
            "-moz-transform": "scale("+0.7+")"
        }).append(contentClone);

    }


    Number.prototype.map = function (in_min, in_max, out_min, out_max) {
        return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
    };

    // http://stackoverflow.com/questions/16227197/compute-intersection-of-two-arrays-in-javascript
    function intersect(a, b) {
        var t;
        if (b.length > a.length) t = b, b = a, a = t; // indexOf to loop over shorter
        return a.filter(function (e) {
            if (b.indexOf(e) !== -1) return true;
        });
    }

});



Storage.prototype.setObject = function(key, value) {
    this.setItem(key, JSON.stringify(value));
};

Storage.prototype.getObject = function(key) {
    var value = this.getItem(key);
    return value && JSON.parse(value);
};




