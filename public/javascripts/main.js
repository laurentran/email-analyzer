$(function(){
    
    var model = 'corpSpeak'; //flag
    var thresholdHi;
    var thresholdLo;
    var label;
    
    if (model === 'corpSpeak') {
        thresholdHi = 0.85;
        thresholdLo = 0.3;
        label = 'Corp Speak?'
        
    } else if (model === 'authoritative') {
        thresholdHi = 0.7;
        thresholdLo = 0.3;
        label = 'Authoritative?'
    }

    var source = $("#search-results").html();
    var dataTemplate = Handlebars.compile(source);
    $results = $('#results')
    
    Handlebars.registerHelper('getColor', function(score) {
       var result = "black";
       if(score > thresholdHi) {
           result = "red";
       } 
       else if (score < thresholdLo) {
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
                    var totalScore = data[0]["score"];
                    data.splice(0,1); //remove element that represents entire email (first element)
                    var isCorporate = "Neutral";
                    var color = "black";
                    if (totalScore > thresholdHi) {
                        isCorporate = "Yes";
                        color = "red";
                    } else if (totalScore < thresholdLo) {
                        isCorporate = "No"
                        color = "green";
                    }
                    $('#totalScore').html(label + " <span style=color:" + color + ">" + isCorporate + "</span> (" + totalScore + ")");
                    $results.html( dataTemplate({resultsArray:data}) ); 
                    document.getElementById("loader").style.display = "none";
                } else {
                    $results.html(data);
                };
            });

        };

    });

});
