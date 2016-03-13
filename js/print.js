/**
 * Created by GaborK on 10/03/16.
 */



var beforeLayout = function(){

    $('.table-of-contents, .maintitle').addClass('h2p-break-after');

    // for some reason it doesn't work to select level1 elements directly
    $('section').each(function(){
        if($(this).hasClass('level1')){
            $(this).addClass('h2p-break-after');
        }
    });
};

var afterLayout = function(){
   console.log('done');
};


H2P.beforeLayout(beforeLayout).afterLayout(afterLayout).init("index.html");



