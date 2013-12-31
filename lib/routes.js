/**
 * 实现路由匹配规则
 *
 * 示例：
 * 访问URL==> http://host/admin/article/a/b/c
 * 则
 * type==>admin 目录
 * controller==>admin.js 一段逻辑
 * method==>根据请求的方法来定，有put,get,post,delete四种。小写
 * 参数为a,b,c
 * controller和type必须设置完方可传参
 * ........
 * 采用了REST设计，所以原来的action体现在URL中，现在体现在请求的方式中
 * 所以URL中的层次可以少一层
 * 为了目录清晰，URL中又加了一层文件夹作为分类:type
 * 一个JS只负责一个URL，最多指负责4件事情。
 * 而原先的设计中，URL可以无限制添加方法，会导致文件负责事情过多，臃肿。
 */

module.exports = function (req, res, next) {
    var url = require('url');
    var path = require('path');
    var fs = require('fs');
    var T = require('./tools');
    var basedir = app.get("basedir");
    var ctrldir = basedir + 'controllers/';
    var viewdir = basedir + 'views/';

    var pathname = T.strTrimRight(url.parse(req.url).pathname, '/');
    var paths = pathname.split("/");
    var type = paths[1];
    var controller = paths[2] || 'index';
    var args;
    var action = req.method.toLowerCase();

    
    /**
     * 路由分发说明：
     * 设lib/group.js中为"common,admin"
     * 访问：
     * 1.http://host/ ==> ctrldir/index.js
     * 2.http://host/common ==> ctrldir/common/index.js
     * 3.http://host/b ==> ctrldir/b.js
     * 4.http://host/common/a ==> ctrldir/common/a.js
     * 5.http://host/common/a/b/c ==> ctrldir/common/a.js
     * 如果ctrldir/a/b.js PUT不存在，则执行b.js INDEX方法
     * 如果仍然不存在，依次往下尝试执行：
     * a/index.js PUT 
     * a/index.js INDEX
     * index.js PUT
     * index.js INDEX
     * 报错
     */
    /**
     * 模板匹配说明：(暂时没实现,模板仍跟请求URL匹配，而非控制器)
     * ctrldir/index.js ==> viewdir/home/default/index.ejs
     * ctrldir/b.js ==> viewdir/home/default/b.js
     * ctrldir/common/index.js 
     * 
     */
    var _tpldir = "";
    if (typeof paths[1] === "undefined") {
        _tpldir = viewdir + "home/default/index.ejs";
        exec(ctrldir + 'index.js', true);
    }else{
        fs.readFile(basedir + 'lib/group.js', function (err, data) {
            if (err) {
                res.send(500, "lib/group.js不存在");
                throw err;
                return;
            };
            data = data.toString(); 
            var groups = data.split(",");

            var ctrlPath = "";
            // 在组内
            if (groups.indexOf(paths[1]) !== -1) {
                _tpldir = viewdir + paths[1] + "/" + controller + ".ejs";
                ctrlPath = ctrldir + paths[1] + "/" + controller + ".js";
                args = paths.slice(3)
            }else{
                _tpldir = viewdir + "home/default/" + paths[1] + ".ejs";
                ctrlPath = ctrldir + paths[1] + ".js";
                args = paths.slice(2)
            }
            req.params = args;

            exec(ctrlPath);
        });
    }



    // 读取控制器并执行
    function exec (path) {
        console.log(1,req.url,path);
        console.log(2,upDir(path));
        fix_render();

        fs.readFile(path, function (err, data) {

            if (err) {
                upPath(path);
                return;
            };

            data = data.toString();

            var module = {};
            
            // 将控制器的函数绑定在module身上
            new Function('exports', 'require', "M", data)(module, require, M);
            
            var method = module[action] || module['index'];

            if (method) {
                try {
                    console.log("controller:"+path)
                    method.apply(null, [req, res].concat(args));
                }catch(err){
                    // 自定义代码执行出错了，抛出错误。
                    next(err);
                }
            }else{
                upPath(path);
            }
        });
    }

    // 调用上一层默认方法,已到顶层则报错
    function upPath (path) {
        var nextPath = upDir(path);
        // 非通用，则调用通用的方法
        if (nextPath) {
            exec(nextPath);
        }else{
            // 手动404貌似不太好，expressjs应该有抛出404错误，集中处理的方式
            // 以后再改
            res.send(404, "网址不存在");
            next();
        }
    }
    

    // 包装新的res.render,提供更方便的API
    function fix_render () {
        console.log("默认tpl",_tpldir)
        var _render = res.render;
        res.render = function (tpldir, data) {
            if (arguments.length === 1) {
                data = tpldir;
                tpldir = _tpldir;
            };
            _render.call(res, tpldir, data);
        }
    }
    
    // 向上一层控制器
    // a/b.js ==> a/index.js
    // a/index.js ==> index.js
    // index.js ==> null
    function upDir (_path) {
        var dir = path.dirname(_path) + "/";
        var filename = path.basename(_path).toLowerCase();
        if (filename !== 'index.js') {
            return dir + "index.js";
        }else{
            dir += "../";
            dir = path.normalize(dir);
            if (path.normalize(basedir) === dir) {
                return null;
            }else{
                return dir + "index.js";
            }
        }
    }

    // 提供M函数
    // 创建model, model能够捕获前端传参，并操作数据库
    // model意在把开发者获取数据->入库的操作智能化
    // modelName映射到/models/modelName.js上
    var mongoose = require('mongoose');

    function M(modelName) {
        var js = fs.readFileSync(basedir + "/models/" + modelName + ".js").toString();
        var exports = eval("("+js+")");
        if (typeof exports.collection !== 'string') {
            throw new Error("缺少有效的collection");
        };
        
        exports.model = createModel(exports);

        // 包装_id
        exports.getObjectId = function (str_id) {
            if (typeof str_id === 'undefined') {
                str_id = req.body._id || req.query._id
            };

            return str_id ? mongoose.Types.ObjectId(str_id) : false;
        }

        // 剔除默认字段,保证不会被前端意外修改
        exports.removeDefaultFields = function (data) {
            ['_id','__v'].forEach(function (key, ind) {
                if (data.hasOwnProperty(key)) {
                    delete data[key];
                };
            })
            
        }

        // 把get与post的参数创建为数据模型
        exports.create = function () {
            
            // get和post的数据全都整合，入库.get/post重复的以post为准
            var data = {};
            for (var key in req.query){
                data[key] = req.query[key];
            }
            for (var key in req.body){
                data[key] = req.body[key];
            }

            // 不符合schema的数据过滤掉
            this.data = data;
            this.removeDefaultFields(this.data);
            this.dataModel = new exports.model(data);

            return true;
        }

        exports.save = function (data, cb) {
            if (arguments.length <= 1) {
                this.create();
                cb = data;
            }else{
                this.data = data;
                this.removeDefaultFields(this.data);
                this.dataModel = new exports.model(data);
            }
            this.dataModel.save(cb);
        }

        // data选填(data||null)，query,cb选填
        exports.update = function (data, query, cb) {
            var argLen = arguments.length;
            var _id = this.getObjectId();

            if (argLen <= 1 || T.isFunction(query) || T.isFunction(data)) {
                if (T.isFunction(query)) {
                    cb = query;
                }else{
                    cb = data;
                    data = null
                }
                query = _id ? {
                    "_id" : _id
                } : {};
            };

            if (!this.data) {
                this.create();
            };

            data = data ? data : {$set:this.data};
            this.removeDefaultFields(this.data);

            this.model.update(query, data, {upsert:true}, function (err, result) {
                if (T.isFunction(cb)) {
                    cb.call(null, err, result);
                }else{
                    if (err) {
                        throw err;
                    };
                }
            });
        }

        // 没写query则根据_id删除
        exports.delete = function (query, cb) {
            if (T.isFunction(query) || arguments.length === 0) {
                cb = query;
                query = {
                    "_id" : this.getObjectId()
                };
            };

            this.model.findOneAndRemove(query, function(err){
                T.isFunction(cb) && cb.call(null, err);
            });
        }

        /**
         * opt.query : find-query,对象
         * opt.fields: 返回的字段
         * opt.options: 配置，有skip和limit
         */

        exports.list = function (opt, cb) {
            if (T.isFunction(opt) || arguments.length === 0) {
                cb = opt;
                opt = {};
            };
            var defaultOpt = {
                query : {},
                fields : null,
                options: {
                    "_skip": 0,
                    "_limit": 10
                }
            }

            // 分页可以从get,post的参数中获取
            if (!opt.options) {
                opt.options = {};
            };

            ["_skip","_limit"].forEach(function (key) {
                if (!opt.options.hasOwnProperty(key)) {
                    opt.options[key] = req.body[key] || 
                                       req.query[key] ||
                                       defaultOpt.options[key];
                };
            })
            

            // 如果opt中设置分页信息，则覆盖get,post的设置
            for (var key in defaultOpt){
                opt[key] = opt[key] || defaultOpt[key];
            }

            this.model.find(opt.query, opt.fields, opt.options, function (err, docs) {
                T.isFunction(cb) && cb.call(null, err, docs);
            })
            
        }

        return exports;
    }

    var db = app.get("db");
    // 根据集合name获取mongoose的model
    function createModel (cfg) {
        var name = cfg.collection;
        var schema = cfg.schema;

        var Model = db.model(name, schema, name, true);

        return Model;
    }


    // 根据name返回一个空的数据模型，name为collection名称
    // var mongoose = require('mongoose');
    // var db = app.get("db");
    // function M(name) {
    //     try {
    //         var Model = db.model(name, {});
    //     }catch(err){
    //         // mongoose重载model会报错，但是第一次又必须有schema，
    //         // 所以。。。try-catch
    //         if (err.name === 'OverwriteModelError'){
    //             var Model = db.model(name);
    //         }
    //     }
    //     Model.upsert = _upsert;
    //     return Model;
    // }

    // // 根据模型实例化一个数据对象
    // function D(model, data) {
    //     if (typeof model === 'string') {
    //         model = M(model);
    //     };

    //     return arguments.length > 1 ? new model(data) : new model();
    // }

    // function _upsert (query, data, opts, cb) {
    //     var argLen = arguments.length;
    //     if (argLen > 2) {
    //         if (T.isFunction(opts)) {
    //             arguments[3] = opts;
    //             arguments[2] = {
    //                 upsert: true
    //             }
    //         }else if(T.isFunction(cb)){
    //             if (!opts.hasOwnproperty("upsert")) {
    //                 arguments[2].upsert = true;
    //             };
    //         }
    //     };
    //     this.update.apply(this, arguments);
        
    // }

}