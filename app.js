var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var request = require('requestretry');
var dotenv = require('dotenv');

dotenv.load();

var Tokenizer = require('sentence-tokenizer');
var app = express();

var modelVersion = 'corpSpeak'; //flag
var url;
var apiKey;

if (modelVersion === 'corpSpeak') {
    url = "https://ussouthcentral.services.azureml.net/workspaces/2d138b0890f844f2a1bf812e7e1e3280/services/03738f8ef25d44509d72ab6d7a8eb9dd/execute?api-version=2.0&details=true";
    apiKey = process.env.MODEL1_KEY;
} else if (modelVersion === 'authoritative') {
    url = "https://ussouthcentral.services.azureml.net/workspaces/2d138b0890f844f2a1bf812e7e1e3280/services/eb991569ebfa40baa9a4f5cff3195466/execute?api-version=2.0&details=true"; //authoritative model
    apiKey = process.env.MODEL2_KEY;
} 

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /pu`blic
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {res.render('index')});
//app.use('/', routes);
//app.use('/users', users);

app.get('/searching', function(req, res){
  var val = req.query.search;

  //get individual sentences from email body
  var sentences = tokenize(val);
  var scores = [];
  
  for (var i = 0; i < sentences.length; i++) {
    var sentence = sentences[i];
    //console.log(sentence);
    var params = configureRequest(sentence, url, apiKey);
    requests(params, i, sentence, function(data, index, text) {
      //scores.push(data);
      scores.push(
        {index:index, text:text, score:data}
      );
      if (scores.length === sentences.length) {
        //console.log(scores);
        
        //now get score for whole email
        var paramsFull = configureRequest(val, url, apiKey);
        requests(paramsFull, -1, val, function(dataFull, indexFull, textFull) {
          scores.push(
            {index: indexFull, text:textFull, score:dataFull}
          );
          res.send(scores);
        });
        
        // res.send(scores);
        //res.render('result', {email: val, score: scores});
      }
    });
  }
});



function configureRequest(val, url, apiKey) {
  var data = {
    "Inputs": {
      "input1":
        {
          "ColumnNames": ["label", "text"],
          "Values": [ [ "0", 0 ], [ "0", val ], ]
        },        
      },
      "GlobalParameters": {}
  }
  var bodyString = JSON.stringify(data);
  var params = {
    url: url,
    method: 'POST',
    headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiKey
      },
    body: bodyString, //Set the body as a string,
    maxAttempts: 5,
    retryDelay: 3000
  };
  return params;
};

function requests(params, index, text, callback) {
  request(params, function(error, response, body){
    var score = 0;
    if(error || response.statusCode !== 200) {
      //console.log(error);
      console.log("Error " + response.statusCode);
    } else {
      //console.log(response.statusCode);
      console.log(text);
      score = JSON.parse(body)["Results"]["output1"]["value"]["Values"][1][1]; //was [1][2]
      //res.render('result', {email: val, score: score});
      console.log(score);
      score = Math.round(score * 10000)/10000;
    }
    callback(score, index, text);
  });
};

function tokenize(emailBody) {
  var tokenizer = new Tokenizer();
  tokenizer.setEntry(emailBody);
  var sentences = tokenizer.getSentences();
  //console.log(sentences);
  return sentences;
};

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
