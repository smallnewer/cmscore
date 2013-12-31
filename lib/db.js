/**
 * 数据库链接
 * 
 */

module.exports = function (app) {
	var mongoose = require('mongoose');

	mongoose.connect("mongodb://127.0.0.1:27017/test");

	var db = mongoose.connection;

	Object.defineProperty(db, "state", {
		get : function () {
			switch (db.readyState){
				case 0:
					return "disconnected";
				case 1:
					return "connected";
				case 2:
					return "connecting";
				case 3:
					return "disconnecting";
			}
		}
	});

	Object.defineProperty(db, "ready", {
		get : function () {
			switch (db.readyState){
				case 1:
					return true;
				default:
					return false;
			}
		}
	});
	db.on('error', function (err) {
		console.log(err);
	});

	db.once("open", function () {
		console.log("数据库连接成功！");
		
		console.log(db.state,db.ready)

		app.set("db", db);
	});
}