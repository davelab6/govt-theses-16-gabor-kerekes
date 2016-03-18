







H2P.doAfterLayout(function(){
    console.log('h2pdelegate task is being done');
    $('p').each(function(index){
        var entropy = 0.1 * index;
        $(this).css('letter-spacing', entropy+'mm');
    });
});