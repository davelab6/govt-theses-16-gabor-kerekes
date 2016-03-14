/**
 * Created by GaborK on 10/03/16.
 */



var beforeLayout = function(){

    $('.table-of-contents, .maintitle').addClass('h2p-break-after');

    // for some reason it doesn't work to select level1 elements directly

};

var afterLayout = function(){
   console.log('done');
};



