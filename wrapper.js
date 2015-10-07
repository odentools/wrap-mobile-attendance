var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var http = require('http');

var app = express();
app.use(bodyParser());
app.use(express.static('www'));

app.post('/refine', function(req, res){
  res.writeHead(200, {"Content-Type": "text/html","Access-Control-Allow-Origin":"*"});

  // 届いたデータを表示
  //console.log(req.body);

  var json;
  var options = {
    url: 'http://develop.oecu.pw/sss/index.json?' + 'uid=' + req.body.usr.uid + '&pass=' + req.body.usr.pass + '&nendo=' + req.body.usr.nendo, 
    json: true
  };

  request.get(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      json = body;

      if ( req.body.refine != null && json.lesson != null) {

        // データ追加
        for (var i = 0; i < json.lesson.length; i++) {
          json.lesson[i]['欠席'] = parseInt(json.lesson[i]['欠']) + parseInt(json.lesson[i]['不']) + (parseInt(json.lesson[i]['遅']) +  parseInt(json.lesson[i]['早'])) / 2;
        }

        // 絞り込み
        for (var i = 0; i < req.body.refine.length; i++){
          for (var j = 0; j < json.lesson.length; j++) {
            switch(req.body.refine[i]['com']){
              case('=='):
                if (json.lesson[j][req.body.refine[i]['key']] != req.body.refine[i]['val']){
                  json.lesson.splice(j,1);
                  j--;
                }
                break;

              case('!='):
                if (json.lesson[j][req.body.refine[i]['key']] == req.body.refine[i]['val']){
                  json.lesson.splice(j,1);
                  j--;
                }
                break;

              case('in'):
                if (json.lesson[j][req.body.refine[i]['key']].indexOf(req.body.refine[i]['val'] ) == -1){
                  json.lesson.splice(j,1);
                  j--;
                }
                break;

              case('!in'):
                if (json.lesson[j][req.body.refine[i]['key']].indexOf(req.body.refine[i]['val'] ) != -1){
                  json.lesson.splice(j,1);
                  j--;
                }
                break;

              case('=>'):
              case('>='):
                if (parseInt(json.lesson[j][req.body.refine[i]['key']]) <= parseInt(req.body.refine[i]['val'])){
                  json.lesson.splice(j,1);
                  j--;
                }
                break;

              case('=<'):
              case('<='):
                if (parseInt(json.lesson[j][req.body.refine[i]['key']]) >= parseInt(req.body.refine[i]['val'])){
                  json.lesson.splice(j,1);
                  j--;
                }
                break;

              case('>'):
                if (parseInt(json.lesson[j][req.body.refine[i]['key']]) < parseInt(req.body.refine[i]['val'])){
                  json.lesson.splice(j,1);
                  j--;
                }
                break;
              case('<'):
                if (parseInt(json.lesson[j][req.body.refine[i]['key']]) > parseInt(req.body.refine[i]['val'])){
                  json.lesson.splice(j,1);
                  j--;
                }
                break;
              default:
                break;
            }
          }
        }
      }

      res.write(JSON.stringify(json));
      res.end();
    } else {
      //console.log('error: '+ response.statusCode);
      res.end();
    }
  })
});

app.post('/table', function(req, res){
  res.writeHead(200, {"Content-Type": "text/html","Access-Control-Allow-Origin":"*"});

  // 届いたデータを表示
  //console.log(req.body);

  var json = req.body;
  json.refine.push({key: "状態", val: "履修", com: "=="});
  json.refine.push({key: "", val: "集中講義", com: "!in"});
  var options = {
    uri: 'http://localhost:8080/refine',
    form: json,
    //json: true
  };
  var ki = ['前期', '後期'];
  var week = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
  var period = ['1', '2', '3', '4', '5', '6', '7'];

  request.post(options, function(error, response, body){
    if (!error && response.statusCode == 200) {
      var bodyJson = JSON.parse(body);

      var json = {};
      for (var i = 0; i < ki.length; i++) {
        var tmpKi = {};
        for (var j = 0; j < week.length; j++) {
          var tmpWeek = {};
          for (var k = 0; k < period.length; k++) {
            tmpWeek[period[k]] = {};
          }
          tmpKi[week[j]] = tmpWeek;
        }
      json[ki[i]] = tmpKi;
      }

      if ( bodyJson.info != null) {
        for (var i = 0; i < bodyJson.lesson.length; i++) {
          var tmpLesson = bodyJson.lesson[i];
          json[tmpLesson['期']][tmpLesson['曜日']][tmpLesson['時限']] = tmpLesson;
          if ( tmpLesson['期間'] == "通年" ) {
            for ( var j = 0; j < ki.length; j++) {
              json[ki[j]][tmpLesson['曜日']][tmpLesson['時限']] = tmpLesson;
            }
          }
        }
      }

      res.write(JSON.stringify(json))
      res.end();
    } else {
      //console.log('error: '+ response.statusCode);
      res.end();
    }
  })
});

app.listen(8080);