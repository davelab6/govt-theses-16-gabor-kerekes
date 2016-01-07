



window.onload = function(){

    var files = [
        "abstract.md",
        "block-chain.md",
        "client-server.md",
        "designer-as-author.md",
        "interfaces.md",
        "movable-type.md",
        "platforms.md",
        "protocols.md",
        "relational-design.md"
    ];

    var mds = {};
    files.forEach(function(file, index){

        $.get('markdown/'+file, function(text){
            mds[file.split('.')[0]] = text;
            if(index == files.length-1){
                onMdLoaded(mds);
            }
        });

    });


};

function onMdLoaded(mds){
    var converter = new showdown.Converter();
    for(k in mds){
        if(mds[k]){
            var html = converter.makeHtml(mds[k]);
            $('<div></div>').html(html).addClass('article').appendTo( $('#wrapper') );
        }

    }
}
