



window.onload = function(){

    var titles = [
        "abstract",
        "agency",
        "information-revolutions",
        "beyond-interfaces",
        "politics-of-code",
        "relational-design"
    ];

    titles.forEach(function(title, index){

        var fname = "content/html/"+title+".html";
        $.get(fname, function(html){
            var elem =  $(html);
            elem.addClass('article').attr('name', title).appendTo('#wrapper');
            $('<a>').addClass('nav-item').text(elem.find('h1').text()).attr('href', '#'+title).appendTo('#nav');
            if(index == titles.length-1){
                onContentLoaded();
            }
        });
    });
};


function onContentLoaded(){
    addHeaderToReferences();
    var taggedElements = collectTaggedElements();
    taggedElements.each(function(index){
        $(this).attr('data-snippet-id', index);
    });
    var topics = collectTopics(taggedElements);
    var snippets = collectSnippets(topics);
    console.log(snippets);

}



function collectSnippets(topics){
    var snippets = {};
    topics.forEach(function(topic){
       snippets[topic] = [];
        $('.'+topic).each(function(){
            snippets[topic].push(

                {   text: $(this).text(),
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
