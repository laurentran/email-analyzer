$(function(){

    var source = $("#search-results").html();
    var dataTemplate = Handlebars.compile(source);
    $results = $('#results')
    
    Handlebars.registerHelper('getColor', function(score) {
       var result = "black";
       if(score > 0.85) {
           result = "red";
       } else if (score < 0.4) {
           result = "green";
       }
       return result;
    });
 
    $('#search').on('keyup', function(e){
        if(e.keyCode === 13) {
         document.getElementById("loader").style.display = "block";
         var parameters = { search: $(this).val() };
            $.get('/searching', parameters, function(data){
                if (data instanceof Array) {
                    data.sort(function(a,b) {return (a.index > b.index) ? 1 : ((b.index > a.index) ? -1 : 0);} ); 
                    $results.html( dataTemplate({resultsArray:data}) ); 
                    document.getElementById("loader").style.display = "none";
                } else {
                    $results.html(data);
                };
            });

        };

    });

});
