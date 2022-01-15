var todoistHelper = (function () {
	var my = {};

    require('dotenv').config();

	const TodoistApi = require('@doist/todoist-api-typescript').TodoistApi
    my.api = new TodoistApi(process.env.TODOIST_API_KEY);

	my.findTask = async function (id) {
		var res = await my.api.getTask(id);
		return res;
	}
    

	my.findAllTasks = async function (filter='') {
		var res = await my.api.getTasks(filter=filter);
		return res;
	}
    

	my.createTask = async function (task) {
		var res = await my.api.addTask(task);
		return res;
	}
    

	my.updateTask = async function (id, task) {
		var res = await my.api.updateTask(id, task);
		return res;
	}
    

	my.closeTask = async function (id) {
		var res = await my.api.closeTask(id);
		return res;
	}
    

	my.reopenTask = async function (id) {
		var res = await my.api.reopenTask(id);
		return res;
	}
    

	my.removeTask = async function (id) {
		var res = await my.api.deleteTask(id);
		return res;
	}

	my.findLabel = async function (id) {
		var res = await my.api.getLabel(id);
		return res;
	}

	my.findAllLabels = async function () {
		var res = [];
		await my.api.getLabels().then(function (labels) {
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
		var res = await my.api.getSection(id);
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

	my.findAllSections = async function (project_id=-1) {
		var res = [];
		if (project_id == -1) {
			await my.api.getSections().then(function (sections) {
				sections.forEach(section => res.push({name: section.name, id: section.id}))
			})
		} else {
			await my.api.getSections(project_id=project_id).then(function (sections) {
				sections.forEach(section => res.push({name: section.name, id: section.id}))
			})
		}
		return res;
	}

	my.findProject = async function (id) {
		var res = await my.api.getProject(id);
		return res;
	}

	my.findAllProjects = async function () {
		var res = [];
		await my.api.getProjects().then(function (projects) {
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