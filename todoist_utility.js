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
			labels.forEach(label => res.push({name: label.name, id: label.id}))
		})
		return res;
	}

	my.getLabel = async function(key, target) {
        const result = await my.findAllLabels().then(function (labels) {
			return labels.reduce(function (r, a) {
				r[a[key]] = r[a[key]] || [];
				r[a[key]].push(a);
				return r;
			}, Object.create(null));
		});
		return result[target][0];
    }

	my.findSection = async function (id) {
		var res = await my.api.section.find(id);
		return res;
	}

	my.getSection = async function (key, target) {
		const result = await my.findAllSections().then(function (sections) {
			return sections.reduce(function (r, a) {
				r[a[key]] = r[a[key]] || [];
				r[a[key]].push(a);
				return r;
			}, Object.create(null));
		});
		return result[target][0];
	}

	my.findAllSections = async function () {
		var res = [];
		await my.api.section.findAll().then(function (sections) {
			sections.forEach(section => res.push({name: section.name, id: section.id}))
		})
		return res;
	}

	my.findProject = async function (id) {
		var res = await my.api.project.find(id);
		return res;
	}

	my.findAllProjects = async function () {
		var res = [];
		await my.api.project.findAll().then(function (projects) {
			projects.forEach(project => res.push({name: project.name, id: project.id}));
		})
		return res;
	}

	my.getProject = async function (key, target) {
		const result = await my.findAllProjects().then(function (projects) {
			return projects.reduce(function (r, a) {
				r[a[key]] = r[a[key]] || [];
				r[a[key]].push(a);
				return r;
			}, Object.create(null));
		});
		return result[target][0];
	}
    
	return my;
}());

module.exports = todoistHelper;

(async() => {
	const res = await todoistHelper.getLabel('name', 'Notion').then(function (label) {
		console.log(label.id);
	})
})();