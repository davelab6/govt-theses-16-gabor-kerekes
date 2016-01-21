/**
 * Created by GaborK on 21/01/16.
 */



$(function(){
   loadThesis('#thesis-wrapper');
});




var loadThesis = function(container){

    var titles = [
        "abstract",
        "agency",
        "information-revolutions",
        "beyond-interfaces",
        "politics-of-code",
        "relational-design"
    ];

    titles.forEach(function(title, index){

        var fname = "site/content/html/"+title+".html";
        $.get(fname, function(html){
            var elem =  $(html);
            elem.addClass('article').attr('name', title).appendTo(container);
            $('<a>').addClass('nav-item').text(elem.find('h1').text()).attr('href', '#'+title).appendTo('#chapters-nav');
            if(index == titles.length-1){
                onContentLoaded();
            }
        });
    });
};

var snippets;
function onContentLoaded(){
    addHeaderToReferences();
    var taggedElements = collectTaggedElements();
    taggedElements.each(function(index){
        $(this).attr('data-snippet-id', index);
    });
    var topics = collectTopics(taggedElements);
    snippets = collectSnippets(topics);
    var titles = collectTitles();
    var mapContent = createMapContent(titles, snippets);
    ThesisMap('#map', mapContent).create();
    attachEventListeners();
}

function attachEventListeners(){
    document.addEventListener('outernode-clicked', function(e){
        removeSnippets();
        var name = e['detail'];
        showSnippets(snippets[name])
    });


    $(document).on('click', '.snippet', function(){
        var id = $(this).data('snippet-id');
        var snippetContainer = $('span').filter(function(){
           return $(this).data('snippet-id') == id;
        });

        snippetContainer.addClass('found-snippet');
        setTimeout(function(){
            snippetContainer.removeClass('found-snippet');
        }, 2100);

        var top =  snippetContainer.offset().top - 30;
        $('html, body').scrollTop( top  );

        hideCover();
    });


    $('#show-map').click(function(){
       showCover();
    });

}


function hideCover(){
    $('#cover').slideUp(200);
}

function showCover(){
    $('#cover').slideDown(200);
}

function showSnippets(snippets){
    console.log(snippets);
    snippets.forEach(function(snippet){
        var snippetContainer = $('<div>').addClass('snippet').attr('data-snippet-id', snippet['id']);
        $('<div>').text(snippet['parent-title']).addClass('snippet-title').appendTo(snippetContainer);
        $('<div>').text(snippet['text']).addClass('snippet-text').appendTo(snippetContainer);
        snippetContainer.appendTo('#snippet-list-container');
    });
}

function removeSnippets(){
    $('#snippet-list-container').empty();
}

function collectTitles(){
    var titles = [];
    $('section').each(function(){
        titles.push($(this).find('h1').text());
    });
    return titles.filter(function(title){ return title != 'Abstract'  });
}


function createMapContent(titles, snippets){
    var tmpcontent = {};
    titles.forEach(function(title){
       tmpcontent[title] = [];
    });

    Object.keys(snippets).forEach(function(key){
        snippets[key].forEach(function(snippet){
            tmpcontent[ snippet['parent-title']].push(key);
        });
    });

    var content = [];
    Object.keys(tmpcontent).forEach(function(key){
        var arr = [];
       arr.push(key);
        arr.push(tmpcontent[key]);
        content.push(arr);
    });

    return content;
}



function collectSnippets(topics){

    function getParentTitle(element){
        return element.parents('section').find('h1').text();
    }

    var snippets = {};
    topics.forEach(function(topic){
        snippets[topic] = [];
        $('.'+topic).each(function(){
            snippets[topic].push(

                {   "parent-title": getParentTitle($(this)),
                    text: $(this).text(),
                    id: $(this).data('snippet-id')
                }
            );
        });
    });

    return snippets;
}

function collectTaggedElements(){
    return $('p').find('span').filter(function(){

        if($(this).attr('class')){
            var classes = $(this).attr('class').split(" ");
            return classes.indexOf('citation') === -1 && classes.indexOf('conclusion') == -1;
        }

        return false;

    });
}

function collectTopics(elements){

    var topics = [];

    elements.each(function(){
        $(this).attr('class').split(" ").forEach(function(topic){
            if(topics.indexOf(topic) == -1){
                topics.push(topic);
            }
        });
    });
    return topics;
}

function addHeaderToReferences(){
    $('.references').each(function(){
        if($(this).children().length > 0){
            $(this).prepend( $('<h3>').text('References') );
        }
    });
}
