/*
 * 文章操作类
 */
exports.get = function(req, res) {

	var basedir = app.get("basedir");
	var viewdir = app.get("views");
	var tpldir = viewdir + "/theme/default/";
	
	var data = M("article.admin");
	data.list(function (err, result) {
		if (err) {throw err};
		res.set("Content-Type", "text/json");
		res.send(200, JSON.stringify(result));
	})

};

// 发布操作
exports.post = function (req, res) {

	var data = M("article.admin");
	data.save();
}

// 更新操作
exports.put = function (req, res) {
	
	var data = M("article.admin");
	// console.log(data.getObjectId());
	data.update(function (err, result) {
		console.log(err);
		data.list(function (err, docs) {
			console.log(docs)
		})
	});
}

// 删除操作
exports.delete = function (req, res) {
	console.log("delete");
	var data = M("article.admin");
	data.delete(function (err) {
		console.log(err)
	});
}