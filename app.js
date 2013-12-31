var express = require('express');
// var routeCfg = require('./configs/routes');
var http = require('http');
var path = require('path');
var fs = require('fs');
var routes = require('./lib/routes');

var app = express();

global.app = app;	// 保证全局可以访问

// all environments
app.set('port', /*process.env.PORT || */8080);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon(__dirname+"/public/favicon.ico"));
app.use(express.logger('dev'));
app.use(express.cookieParser());
// 以后密匙在安装时随机生成
app.use(express.session({ secret: "adlkjlaJOASDNFLo" }));
app.use(express.bodyParser());
app.use(express.methodOverride());
// app.use(app.router); // 无需express的路由体系了
app.use(require('less-middleware')({ src: __dirname + '/public' }));

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());

}

fs.readFile('app.js', function (err, data) {

		if (err) {
			res.send(404, "请求文件不存在");
			console.error(err);
			return;
		};
		console.log(123)
	});

// development only
app.configure('development', function(){
    
})

// production only
app.configure('production', function(){
    
})

/**
 * 路由处理
 * 先保证静态资源的读取，其次是逻辑代码。
 * 也可以反过来，处理麻烦，且会影响纯静态资源读取速度
 */

app.use(express.static(path.join(__dirname, 'public')));
app.use(routes);

http.createServer(app).listen(app.get('port'), function(){

    var d = new Date();
    var year = d.getFullYear();
    var month = d.getMonth() + 1;
    var date = d.getDate();
    var day = d.getDay();
    var Hours = d.getHours();
    var Minutes = d.getMinutes();
    var Seconds = d.getSeconds();
    console.log('服务器('+ app.get('port') +')重新启动于 ' +
             year + "年" + month + "月" + day + "日" + Hours + 
             "时" + Minutes + "分" + Seconds + "秒");
});


require('./lib/common')(app);
var db = app.get("db");

db(app);

process.on('uncaughtException', function(err){
    throw err;
}); 
