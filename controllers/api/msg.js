
// 获取操作
exports.get = function (req, res) {
	var method = req.query.method;
	switch(method){
		case "add":
			_add();
			break;
		case "list":
			_list();
			break;
		case "good":
			_good();
			break;
		default:
			_needMethod();
			break;
	}

	function output (result) {
		var jsoncb = req.query.jsoncb || req.body.jsoncb;

		if (jsoncb) {
			result = jsoncb + "(" + JSON.stringify(result) + ")";
		};

		res.set('Content-Type', 'application/json');	
		res.send(200, result);
	}

	function _needMethod () {
		output({
			done: false,
			code: 1,
			message: "method参数必填"
		});
	}

	function _add () {
		// code:0-未登录,1-没有权限,2-其他错误
		//  权限验证
		if (!req.session.logined) {
			var result = {
				done: false,
				code: 0,
				message: "请先登录"
			}
			output(result);
			return;
		};
		var m = M('msg.api');
		m.save({
			text: req.query.text,
			time: Date.now(),
			author: req.session.uid
		},function (err) {
			var result = {};
			if (err) {
				result.done = false;
				result.message = err.message;
			}else{
				result.done = true;
			}
			output(result);
		});
	}

	function _list () {
		//  权限验证
		if (!req.session.logined) {
			var result = {
				done: false,
				code: 0,
				message: "请先登录"
			}
			output(result);
			return;
		};
		var m = M('msg.api');
		// 这里populate会把关联所有字段输入进去，所以第二
		// 参数加fields限制。如.populate("author","-password")
		// 也可以在schema中设置属性为不可读
		m.model.find({
			author : req.query.uid
		}).populate("author",'-password').sort({
			time: req.query.sort || -1
		}).exec(function (err, docs) {
			var result = {};
			if (err) {
				result.message = err.message;
				result.done = false;
				result.code = 1;
			}else{
				result.done = true;
				result.data = docs;
			}
			output(result);
		})
	}

	function _good () {
		//  权限验证
		if (!req.session.logined) {
			var result = {
				done: false,
				code: 0,
				message: "请先登录"
			}
			output(result);
			return;
		};
		var m = M('msg.api');
		m.model.update({
			_id: req.session.uid
		}, {
			$push: {
				"gooded" : req.query.mid
			}
		}).exec(function (err) {
			var result = {};
			if (err) {
				result.done = false;
				result.message = err.message;
				output(result)
			}else{
				m.model.update({
					_id: req.query.mid
				}, {
					$inc:{
						good : 1
					}
				}).exec(function (err) {
					if (err) {
						result.done = false;
						result.message = err.message;
					}else{
						result.done = true;
					}
					output(result)
				})
			}
		})
	}
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