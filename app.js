var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var request = require('requestretry');

var Tokenizer = require('sentence-tokenizer');
var Promise = require('bluebird');

//var routes = require('./routes/index');
//var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
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
  //console.log(val);
  var url = "https://ussouthcentral.services.azureml.net/workspaces/2d138b0890f844f2a1bf812e7e1e3280/services/03738f8ef25d44509d72ab6d7a8eb9dd/execute?api-version=2.0&details=true";
  var apiKey = '1f+rHoMaDmv7HlvSnKiOUfhF5/i7PzvufeakquYdBICjx9SuWXSRTy23IDkgouyglOMIMZUGOwLBEFClrDB+Dw==';
  
  //get individual sentences from email body
  var sentences = tokenize(val);
  var scores = [];
  
  for (var i = 0; i < sentences.length; i++) {
    var sentence = sentences[i];
    console.log(sentence);
    var params = configureRequest(sentence, url, apiKey);
    requests(params, i, sentence, function(data, index, text) {
      //scores.push(data);
      scores.push(
        {index:index, text:text, score:data}
      );
      if (scores.length === sentences.length) {
        console.log(scores);
        res.send(scores);
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
          "ColumnNames": ["sentiment_label", "tweet_text"],
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

// function requests(params, index, text, callback) {
//   request(params, function(error, response, body){
//     var score = 0;
//     if(error) {
//       console.log(error);
//       console.log("Error " + response.statusCode);
//     } else {
//       console.log(response.statusCode);
//       score = JSON.parse(body)["Results"]["output1"]["value"]["Values"][1][2];
//       //res.render('result', {email: val, score: score});
//       console.log(score);
//       score = Math.round(score * 100)/100;
//     }
//     callback(score, index, text);
//   });
// };

function requests(params, index, text, callback) {
  request(params, function(error, response, body){
    var score = 0;
    if(error || response.statusCode !== 200) {
      console.log(error);
      console.log("Error " + response.statusCode);
    } else {
      console.log(response.statusCode);
      score = JSON.parse(body)["Results"]["output1"]["value"]["Values"][1][2];
      //res.render('result', {email: val, score: score});
      console.log(score);
      score = Math.round(score * 100)/100;
    }
    callback(score, index, text);
  });
};

function tokenize(emailBody) {
  var tokenizer = new Tokenizer();
  tokenizer.setEntry(emailBody);
  var sentences = tokenizer.getSentences();
  console.log(sentences);
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
