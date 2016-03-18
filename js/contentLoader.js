


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