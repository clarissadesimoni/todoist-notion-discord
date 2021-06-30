var tasklistHelper = (function () {
	var my = {};

    require('dotenv').config();

    const notion = require('./notion_utility'); // can call it like notion.funcName(params);
	const todoist = require('./todoist_utility'); // can call it like notion.funcName(params);	
    
	my.setup = async function () {
		my.labels = todoist.findAllLabels();
		my.sections = todoist.findAllSections();
		my.projects = todoist.findAllProjects();
	}

	my.getTodoist = async function () {
		var todoist_labels = await todoist.findAllLabels();
		var tasks = await notion.getTodaysTask()
			.then(notionTasks => notionTasks.filter(task => task.properties.TodoistTaskID !== null && typeof task.properties.TodoistTaskID !== 'undefined'))
			.then(notionTasks => notionTasks.map(task => await todoist.findTask(task.properties.TodoistTaskID)))
			.then(notionTasks => notionTasks.filter(task => todoist_labels.strKey.Discord in task.labels));
		return tasks;
	}

	my.getTasklist = async function () {
		var all_tasks = await my.getTodoist();
		var tasklist = all_tasks.reduce(function (r, a) {
			r[my.projects.intKey[a.id]] = r[my.projects.intKey[a.id]] || [];
			r[my.projects.intKey[a.id]].push(a);
			return r;
		}, Object.create(null));
		for(var project in tasklist) {
			tasklist[project] = tasklist[project].reduce(function (r, a) {
				r[my.sections.intKey[a.id]] = r[my.sections.intKey[a.id]] || [];
				r[my.sections.intKey[a.id]].push(a);
				return r;
			}, Object.create(null));
		}
	}

	my.stringifyTask = function (task) {
		var emotes = {
            1: ':mdot_red',
            2: ':mdot_yellow',
            3: ':mdot_blue',
            4: ':mdot_grey'
        }
		var ls = my.labels.strKey.Started;
		task.completed = task.checked == 1 || (task.due.is_recurring)
		if(task.completed) {

		}
	}

	return my;
}());

module.exports = tasklistHelper;