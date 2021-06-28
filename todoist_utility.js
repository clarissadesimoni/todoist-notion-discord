var todoistHelper = (function () {
	var my = {};

    require('dotenv').config();

    my.api = require('todoist-rest-api').default(process.env.TODOIST_API_KEY).v1;

	my.find = async function (id) {
		res = await my.api.find(id);
		return res;
	}
    

	my.findAll = async function () {
		res = await my.api.findAll();
		return res;
	}
    

	my.create = async function (task) {
		res = await my.api.create(task);
		return res;
	}
    

	my.update = async function (id, task) {
		res = await my.api.update(id, task);
		return res;
	}
    

	my.close = async function (id) {
		res = await my.api.close(id);
		return res;
	}
    

	my.reopen = async function (id) {
		res = await my.api.reopen(id);
		return res;
	}
    

	my.remove = async function (id) {
		res = await my.api.remove(id);
		return res;
	}
    
	return my;
}());

module.exports = todoistHelper;