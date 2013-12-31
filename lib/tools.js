/**
 * JS 语言特性
 * 
 */
module.exports = (function () {
	var fs = require('fs');
	var Tools = {};

	/**
	 * 类型判断
	 */

	Tools.isType = function (data, type) {
		return Object.prototype.toString.call(data) === "[object " + type + "]";
	}

	var x = ["Number","String","Boolean","Function","Undefined","Null","Object","Array"];
	x.forEach(function (key, ind) {
		Tools["is"+key] = function (data) {
			return Tools.isType(data, key);
		}
	});

	/**
	 * 简单的字符串替换
	 * 应用场景决定没有大量重复替换，因此不做缓存
	 */
	Tools.strReplace = function (str ,data){
		str = str.replace(/{{(.*?)}}/gi,function (s1, s2, ind) {
			return typeof data[s2] === 'undefined' ? s1 : data[s2];
		});
		return str;
	}

	/**
	 * 移除末端指定字符
	 *
	 * 示例：fn(str, '/')
	 * '/a/' ==> '/a'
	 * '/a/////' ==> '/a'
	 */
	Tools.strTrimRight = function (str, tag) {
		var reg = new RegExp(tag + "+$", '');
		str = str.replace(reg, function () {
			return '';
		});
		return str;
	}	


	// 
	return Tools;

})();