/**
 * 数据库链接
 * 
 */

module.exports = function (app) {
	var C = {};
	C.tools = require('../lib/tools');
	C.db = require('../lib/db');
	C.basedir = __dirname + "/../";

	if (!app.set) {
		return C;
	};
	
	for (var key in C){
		if (C.hasOwnProperty(key)) {
			app.set(key, C[key]);
		};
	}


	return C;
}