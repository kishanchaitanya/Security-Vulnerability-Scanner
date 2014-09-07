/**
 * Module dependencies.
 */

var crypto = require('crypto');

var express = require('express');
var http = require('http');
var path = require('path');
var temp = require('temp'),
    fs = require('fs'),
    util = require('util'),
    path = require('path'),
    exec = require('child_process').exec;

var app = express();
var mongojs = require('mongojs');
var db = mongojs('localhost:27017/eye');

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
app.use(require('less-middleware')({
    src: path.join(__dirname, 'public')
}));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

app.use(express.bodyParser());


app.get('/', function (req, res) {
    res.redirect('/index.html');
});

app.post('/eye/ajaxscanurl', function (req, res) {
    var url = req.body.url;
    var sessions = db.collection('sessions');
     console.log(url);
    sessions.findOne({
        'url': url
    }, function (err, doc) {
	console.error('Check for Error');
        console.error(err);
	console.log('Is Doc PResent');
        console.log(doc);
        if (!doc) {
            var dir = crypto.randomBytes(6).readUInt32LE(0);
            var tmpdir = '/home/kishan/Documents/app/public/reports/' + dir;
            var data = {
                url: url,
                processed: 0,
                pending: 0,
                progress: 0,
                path: tmpdir,
                _id: dir,
                time: new Date()
            };
	    console.log(data);
            sessions.insert(data);
            doc = data;
            var commandLine = "java -jar /home/kishan/Documents/app/SkipFish.jar " + data._id;
            console.log(commandLine);
            var child = exec(commandLine,
                function (error, stdout, stderr) {
                    console.error(error);
                });
        }
        res.send({
            id: doc._id
        });
    });
});



app.post('/eye/ajaxhistory', function (req, res) {
    var url = req.body.url;
    var sessions = db.collection('completedsessions');
    sessions.find({
        'url': url
    }, function (err, doc) {
        if (!doc) {
            res.send([]);
        } else {
	    console.log(doc);
            res.send(doc);
        }
    });
});

app.get('/eye/status/:sessionid', function (req, res) {
    var sessionid = req.params.sessionid;
    var sessions = db.collection('sessions');
    var completedsessions = db.collection('completedsessions');
    sessions.findOne({
        '_id': parseInt(sessionid)
    }, function (err, doc) {
	console.log('/eye/status/' + req.body.sessionid);	
	console.log(doc);        
	if (!doc) {
	completedsessions.findOne({
        '_id': parseInt(sessionid)
    },function (err, doc) {

if (!doc) {
res.send("Invalid session id.", 404);
}else{
res.redirect('/eye/reports/' + sessionid);
}

});
            
        } else {
            res.render('status', {
                sessionid: req.params.sessionid
            });
        }
    });
});

app.get('/eye/reports/:sessionid', function (req, res) {
    var sessionid = req.params.sessionid;
    var completedsessions = db.collection('completedsessions');

    completedsessions.findOne({
        '_id': parseInt(sessionid)
    }, function (err, doc) {
        console.error(doc);
        console.error("-----------------");
        console.error(err);
        if (!doc) {
            res.send("Invalid report id.", 404);
        } else {
            res.render('report', {
                reportFolder: doc._id
            });
        }
    });
});


app.post('/eye/ajaxscanstatus', function (req, res) {
    var sessionid = req.body.sessionid;
    var sessions = db.collection('sessions');
    var completedsessions = db.collection('completedsessions');
    var sessionEntry = null;

    sessions.findOne({
        '_id': parseInt(sessionid)
    }, function (err, doc) {
        console.error(doc);
        console.error("-----------------");
        console.error(err);
        sessionEntry = doc;
        if (sessionEntry == null) {
            completedsessions.findOne({
                '_id': parseInt(sessionid)
            }, function (err, doc) {
                if (doc == null) {
                    var result = {
                        result: false
                    };
		    res.send(result);
                } else {
		   var result = {
                        result: true,
                        redirect: true,
                        url: '/eye/reports/' + sessionid
                    };
		    console.log(result);
                    res.send(result);
                }
            });
        } else {
	    var result = {
                result: true,
                redirect: false,
                pending: sessionEntry.pending,
                processed: sessionEntry.processed,
                progress: sessionEntry.progress
            };
	console.log(result);
            res.send(result);
        }
    });

});



http.createServer(app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});
