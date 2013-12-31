
// 获取操作
exports.get = function (req, res) {
	res.render({
		logined:!!req.session.logined,
		name : req.session.username,
		uid : req.session.uid
	});
}

// 发布操作
exports.post = function (req, res) {
	
}

// 更新操作
exports.put = function (req, res) {
	
}

// 删除操作
exports.delete = function (req, res) {
	
}