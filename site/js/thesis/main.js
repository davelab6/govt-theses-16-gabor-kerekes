



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
    $('.references').each(function(){
        if($(this).children().length > 0){
            $(this).prepend( $('<h3>').text('References') );
        }
    });

}
