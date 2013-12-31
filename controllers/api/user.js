
// 获取操作
exports.get = function (req, res) {
	console.log('get',req.session);

	switch (req.query.method){
		case "regist":
			_regist();
			break;
		case "login":
			_login();
			break;
		case "logout":
			_logout();
			break;
		case "getinfo":
			_getinfo();
			break;
		case "listuser":
			_listuser();
			break;
		default:
			_needMethod();
			break;
	}

	// 注册
	function _regist () {
		var result = {
			done: false
		};
		var m = M("user.api");
		// code :0-未知错误，1-字段不全，2-用户名重复
		m.save(function (err) {
			console.log(123)
			if (err) {
				console.log(123)
				switch(err.name){
					// 验证失败
					case "ValidationError":
						var needs = '';

						for (var key in err.errors) {
							if (err.errors[key].type === 'required') {
								needs += ',' + err.errors[key].path;
							};
						};

						result.done = false;
						result.code = 1;
						result.message = needs.slice(1) + "参数必填";

						break;
					// 用户名重复
					case "MongoError":
						if (err.code === 11000) {
							result.done = false;
							result.code = 2;
							result.message = "用户名重复";
						};
						break;
					// 其他错误
					default:
						result.done = false;
						result.code = 0;
						result.message = err.message;
						console.log(err);
						break;
				}
				
			}else{
				result.done = true;
			}

			output(result);
		});
	}

	function _needMethod () {
		output({
			done: false,
			code: 1,
			message: "method参数必填"
		});
	}

	function output (result) {
		var jsoncb = req.query.jsoncb || req.body.jsoncb;

		if (jsoncb) {
			result = jsoncb + "(" + JSON.stringify(result) + ")";
		};

		res.set('Content-Type', 'application/json');	
		res.send(200, result);
	}

	function _login () {
		// 验证
		if (req.session.logined === true) {
			output({
				done: true
			});
			return;
		};
		
		var m = M("user.api");
		var uname = req.query.name;
		var pwd = req.query.password;

		m.list({
			query:{
				name:uname,
				password:pwd
			},
			fields:"name _id"
		},function (err, docs) {
			// code : 0-用户名密码错误,1-其他错误
			var result = {};

			if (err) {
				result.done = false;
				result.code = 1;
				result.message = err.message;
			};

			if (docs.length > 0) {
				result.done = true;
				req.session.logined = true;
				req.session.username = docs[0].name;
				req.session.uid = docs[0]._id;
				req.session.logintime = Date.now();
			};

			if (docs.length === 0) {
				result.done = false;
				result.code = 0;
				result.message = "用户名密码错误";
			};
			

			output(result);
		})
	}

	function _logout () {
		req.session.logined = false;
		delete req.session.username;
		delete req.session.logintime;
		delete req.session.uid;
		output({
			done:true
		})
	}

	function _getinfo () {
		var m = M("user.api");
		// code 0-没有该用户，1-其他错误
		m.model.findOne({
			name: req.query.name
		},"name").exec(function (err, doc) {
			var result = {};
			if (err) {
				result.done = false;
				result.message = err.message;
				result.code = 1;
			}else if(!doc){
				result.done = false;
				result.message = "没有该用户";
				result.code = 0;
			}else{
				result.done = true;
				result.data = doc;
			}
			output(result);
		})
	}

	function _listuser () {
		var m = M("user.api");
		m.model.find({},"name id",{
			skip: (req.query.page || 0) * (req.query.count || 10),
			limit: (req.query.count || 10)
		}).sort({_id:-1}).exec(function (err, docs) {
			var result = {};
			if (err) {
				result.done = false;
				result.message = err.message;
			}else{
				result.done = true;
				result.data = docs;
			}
			output(result)
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