/**
 * Created by GaborK on 10/03/16.
 */


H2P.init().done(function(){


    //var imgSettings = {
    //
    //
    //    "viv_global_brain":     {   before:  false, after: false    },
    //    "microchip":            {   before:  false, after: false    },
    //    //"NationState":          {   before:  false, after: false, css: { width:  "190mm", left:   "20mm", margin: "auto" } },
    //    "OSIModel":             {   before:  false, after: true, css: { width:  "180mm", left:   "14mm", margin: "auto" }    },
    //    "theStack":             {   before:  false, after: false    },
    //    "interrogation":        {   before:  false, after: false    },
    //    "facebook_dossier":     {   before:  false, after: false, css: { width:  "200mm", left:   "28mm", margin: "auto" } },
    //    "kinect":               {   before:  false, after: false    },
    //    "gui":                  {   before:  false, after: false    }
    //
    //};
    //
    //
    //Object.keys(imgSettings).forEach(function(key){
    //    var container =  $( '#'+key );
    //    if(imgSettings[key].before) {   container.addClass('break-before');  }
    //    if(imgSettings[key].after) {   container.addClass('break-after');  }
    //    if(imgSettings[key].css) {   container.css( imgSettings[key].css );  }
    //});


    $('.level1').each(function(index){
        var header =  $(this).find('h1');
        var headerText = header.text();
        var regex = /^[0-9]\.\s/;
        var match = headerText.match(regex);

        var wrapper = $('<div>').addClass('chapter-heading-wrapper');
        var result;

        if(match){
            result = match[0];
            header.text(headerText.replace(result, ''));
        }
        result = index + ".";

        var numberContainer =  $('<div>').addClass('chapter-number').text(result.trim());
        wrapper.append(numberContainer);
        wrapper.insertBefore(header);

        header.remove();
        header.appendTo(wrapper);

        //console.log(header);

    });


    //// print header title
    //$('<div>').attr('id','print-header-title').text('From Text to Process').appendTo('body');
    //console.log(new Date().toISOString());
    //$('<div>').attr('id','print-header-date').text( new Date().toISOString()).appendTo('body');
    //$('<div>').attr('id','print-footer-url').text(window.location).appendTo('body');


});
