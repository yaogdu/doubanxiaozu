var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');
var superagent = require('superagent');
var cheerio = require('cheerio');
var eventproxy = require('eventproxy');
var url = require('url');
var fs =require('fs');


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);
app.get('/douban1',function(req,res,next){
    superagent.get('http://www.douban.com/group/haixiuzu','UTF-8')
        .end(function(err,srs){
            if(err){
                return next(err);
            }

            var $ = cheerio.load(srs.text);
            var items = [];
            $('body .title a').each(function(idx,element){
                var $element = $(element);
                //console.log('1111111');
                //    items.push({
                //        title : $element.attr('title'),
                //        href : $element.attr('href')
                //    });
                //    console.log('idx:'+idx);
                var href = $element.attr('href');
                if(href.indexOf('topic')!=-1){
                    items.push(href);
                }
            });

            //res.send(items);

            var ep =  new eventproxy();

            var html =  '';
            var img_counter = 0;
            var post_counter = 0;
            ep.after('topic_html',items.length,function(topics){

                topics =topics.map(function(topicPair){
                    var topicUrl = topicPair[0];
                    var topicHtml = topicPair[1];
                    var $ = cheerio.load(topicHtml);

                   // console.log("title:"+$('body .landing h1').text());

                    var img_length = $('body #link-report').find('.topic-figure').length;
                    var tts = [];
                    //console.log("img_length:"+img_length);
                     ;
                    if(img_length>0){
                        //console.log('img_length'+img_length);
                        //console.log('url:'+topicUrl);
                        post_counter ++;
                        var topic = {
                            uuurl: topicUrl,
                            title :$('body .landing').find('H1').text(),
                            content : $('body #link-report').find('.topic-content').find('p').text()
                        };
                        var hrefs = [];
                        for(var i = 0;i<img_length;i++){
                            //console.log($('body #link-report').find('.topic-figure').find('img').eq(i).attr('src'));
                            hrefs.push( $('body #link-report').find('.topic-figure').find('img').eq(i).attr('src'));

                            // topic["href"] =  $('body #link-report').find('.topic-figure').find('img')[i].attr('src');
                        }
                        img_counter += hrefs.length;
                        topic["href"]= hrefs;
                        return(topic);
                    }

                    return ({});
                   // console.log('tts.length:'+tts.length);
                    //return tts;
                    //return ({
                    //    uuurl: topicUrl,
                    //    title :$('body .landing').find('H1').text(),
                    //    content : $('body #link-report').find('.topic-content').find('p').text(),
                    //
                    //});
                });
                console.log('final:');
                console.log(img_counter);
                for(var i in topics ){
                    var  t = topics[i];
                    var hrefs = t["href"];
                    //console.log("hrefs.length:"+hrefs);
                    for(var i in hrefs){
                        var h = hrefs[i];
                        if(h){
                            html +='<a target="_blank" href="'+t['uuurl']+'"><img src="'+t['href']+'"/></a>';
                        }
                    }
                }
                html += '<p>'+img_counter+'图片来自'+post_counter+'贴子</p>';
                res.send(html);

            });





            items.forEach(function(topicUrl){
                superagent.get(topicUrl)
                    .end(function(err,sr){
                        //console.log(topicUrl);
                        //HTML += "<A HREF = 'AAA'>AAAAAAA</A>";

                       // console.log(sr.text);
                        ep.emit('topic_html',[topicUrl,sr.text]);
                    });
            });
           // res.send(html);

        });


});
app.get('/douban',function(req,res,next){
    superagent.get('http://www.douban.com/group/haixiuzu','UTF-8')
        .end(function(err,srs){
            if(err){
                return next(err);
            }

            var $ = cheerio.load(srs.text);
            var items = [];
            $('body .title a').each(function(idx,element){
                var $element = $(element);
                //console.log('1111111');
                //    items.push({
                //        title : $element.attr('title'),
                //        href : $element.attr('href')
                //    });
                //    console.log('idx:'+idx);
                var href = $element.attr('href');
                if(href.indexOf('topic')!=-1){
                    items.push(href);
                }
            });

            //res.send(items);

            var ep =  new eventproxy();

            var html =  '';
            var img_counter = 0;
            var post_counter = 0;
            ep.after('topic_html',items.length,function(topics){

                topics =topics.map(function(topicPair){
                    var topicUrl = topicPair[0];
                    var topicHtml = topicPair[1];
                    var $ = cheerio.load(topicHtml);


                    var img_length = $('body #link-report').find('.topic-figure').length;
                    var tts = [];
                    ;
                    if(img_length>0){
                        post_counter ++;
                        for(var i = 0;i<img_length;i++){
                            var topic = {
                                uuurl: topicUrl,
                                title :$('body .landing').find('H1').text(),
                                content : $('body #link-report').find('.topic-content').find('p').text(),
                                href : $('body #link-report').find('.topic-figure').find('img').eq(i).attr('src')

                            };
                            return(topic);
                        }

                    }

                    return ({});
                });
                console.log('final:');
                console.log(topics.length);
                for(var i in topics ){
                    var  t = topics[i];
                    html +='<a target="_blank" href="'+t['uuurl']+'"><img src="'+t['href']+'"/></a>';
                }
                html += '<p>'+topics.length+'图片来自'+post_counter+'贴子</p>';
                res.send(html);

            });





            items.forEach(function(topicUrl){
                superagent.get(topicUrl)
                    .end(function(err,sr){
                        //console.log(topicUrl);
                        //HTML += "<A HREF = 'AAA'>AAAAAAA</A>";

                        // console.log(sr.text);
                        ep.emit('topic_html',[topicUrl,sr.text]);
                    });
            });
            // res.send(html);

        });


});



/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});



/// error handlers

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
