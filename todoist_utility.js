var todoistHelper = (function () {
	var my = {};

    require('dotenv').config();

    my.api = require('todoist-rest-api').default(process.env.TODOIST_API_KEY).v1;

	my.findTask = async function (id) {
		var res = await my.api.task.find(id);
		return res;
	}
    

	my.findAllTasks = async function () {
		var res = await my.api.task.findAll();
		return res;
	}
    

	my.createTask = async function (task) {
		var res = await my.api.task.create(task);
		return res;
	}
    

	my.updateTask = async function (id, task) {
		var res = await my.api.task.update(id, task);
		return res;
	}
    

	my.closeTask = async function (id) {
		var res = await my.api.task.close(id);
		return res;
	}
    

	my.reopenTask = async function (id) {
		var res = await my.api.task.reopen(id);
		return res;
	}
    

	my.removeTask = async function (id) {
		var res = await my.api.task.remove(id);
		return res;
	}

	my.findLabel = async function (id) {
		var res = await my.api.label.find(id);
		return res;
	}

	my.findAllLabels = async function () {
		var res = [];
		await my.api.label.findAll().then(function (labels) {
			labels.forEach(res.push({name: label.name, id: label.id}))
		})
		return res;
	}

	my.getLabel = function(key, target) {
        result = projects.reduce(function (r, a) {
            r[a[key]] = r[a[key]] || [];
            r[a[key]].push(a);
            return r;
        }, Object.create(null));
		return object[target];
    }

	my.findSection = async function (id) {
		var res = await my.api.section.find(id);
		return res;
	}

	my.findAllSections = async function () {
		var res = {
			strKey: {},
			intKey: {}
		};
		await my.api.section.findAll().then(function (sections) {
			sections.forEach(function (section) {
				res.strKey[section.name] = section.id;
				res.intKey[section.id] = section.name;
			})
		})
		return res;
	}

	my.findProject = async function (id) {
		var res = await my.api.project.find(id);
		return res;
	}

	my.findAllProjects = async function () {
		var res = {
			strKey: {},
			intKey: {}
		};
		await my.api.project.findAll().then(function (projects) {
			projects.forEach(function (project) {
				res.strKey[project.name] = project.id;
				res.intKey[project.id] = project.name;
			})
		})
		return res;
	}
    
	return my;
}());

module.exports = todoistHelper;