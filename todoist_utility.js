var todoistHelper = (function () {
	var my = {};

    require('dotenv').config();

    my.api = require('todoist-rest-api').default(process.env.TODOIST_API_KEY).v1;

	my.findTask = async function (id) {
		res = await my.api.task.find(id);
		return res;
	}
    

	my.findAllTasks = async function () {
		res = await my.api.task.findAll();
		return res;
	}
    

	my.createTask = async function (task) {
		res = await my.api.task.create(task);
		return res;
	}
    

	my.updateTask = async function (id, task) {
		res = await my.api.task.update(id, task);
		return res;
	}
    

	my.closeTask = async function (id) {
		res = await my.api.task.close(id);
		return res;
	}
    

	my.reopenTask = async function (id) {
		res = await my.api.task.reopen(id);
		return res;
	}
    

	my.removeTask = async function (id) {
		res = await my.api.task.remove(id);
		return res;
	}
    
	return my;
}());

module.exports = todoistHelper;