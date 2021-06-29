var notionHelper = (function () {
	var my = {};

    require('dotenv').config();

    const {Client} = require('@notionhq/client');
    my.api = new Client({auth: process.env.NOTION_API_KEY});
    const databases = require('./databases.json')
    const projects = require('./projects.json')

    my.createTask = async function(name, todoist_project_id, todoist_task_id, do_date) {
        var tasks_db_id = databases.Tasks
        var req_body = {
            parent: {
                type: 'database_id',
                database_id: tasks_db_id
            },
            properties: {
                Name: {
                    title: [
                        {
                            text: {
                                content: name,
                            },
                        },
                    ],
                },
                Project: {
                    relation: [
                        {
                            id: my.projects[todoist_project_id].notion_id
                        }
                    ]
                }
            }
        }
        if(typeof todoist_task_id !== 'undefined') {
            req_body.properties.TodoistTaskID = {
                number: todoist_task_id
            }
        }
        if(typeof do_date !== 'undefined') {
            req_body.properties.DoDate = {
                date: {
                    start: do_date
                }
            }
        }
        const response = await my.api.pages.create(req_body);
        return response.id;
    }

    my.updateTask = async function(notion_page_id, name, todoist_project_id, do_date) {
        var req_body = {
            page_id: notion_page_id,
            properties: {
                Name: {
                    title: [
                        {
                            text: {
                                content: name,
                            },
                        },
                    ],
                },
                Project: {
                    relation: [
                        {
                            id: my.projects[todoist_project_id].notion_id
                        }
                    ]
                }
            }
        }
        if(typeof do_date !== 'undefined') {
            req_body.properties.DoDate = {
                date: {
                    start: do_date
                }
            }
        }
        const response = await my.api.pages.create(req_body);
        return response.status;
    }

    my.completeTask = async function (notion_page_id) {
        const response = await my.api.pages.update({
            page_id: notion_page_id,
            properties: {
                Completed: {
                    checkbox: true
                }
            }
        });
        return response.status;
    }

    my.addProject = async function (name) {
        var projects_db_id = databases.Projects
        var req_body = {
            parent: {
                type: 'database_id',
                database_id: projects_db_id
            },
            properties: {
                Name: {
                    title: [
                        {
                            text: {
                                content: name,
                            },
                        },
                    ],
                }
            }
        }
        const response = await my.api.pages.create(req_body);
        return response.id;
    }

	my.simplifyPage = function (
        page,
        attrsToRemove = ['object', 'created_time', 'last_edited_time', 'archived'],
        propsToRemove = ["isNextMonth?", "Progress bar", "previousDoneFormula", "Done", "childrenDone", "Due date", "isThisWeek?", "isProjectActive?", "Completed?", "previousDone", "previousToScheduleCount", "Previous", "Children tasks", "toSchedule", "parentPreviousDone", "availableNow", "Parent task", "isNextWeek?", "progressInt", "isThisMonth?", "Next"]
    ) {
        for(const field of attrsToRemove) {
            delete page[field];
        }
        for(const field of propsToRemove) {
            delete page.properties[field];
        }
        page.parent = page.parent.database_id;
        for(const field in page.properties) {
            if(page.properties[field].type === 'formula') {
            page.properties[field] = page.properties[field].formula[page.properties[field].formula.type];
            } else if(page.properties[field].type === 'rollup') {
            page.properties[field] = page.properties[field].rollup[page.properties[field].rollup.type];
            } else if(page.properties[field].type === 'relation') {
            page.properties[field] = page.properties[field].relation.map(rel => rel.id);
            } else if(page.properties[field].type === 'date') {
            page.properties[field] = page.properties[field].date;
            } else if(page.properties[field].type === 'checkbox') {
            page.properties[field] = page.properties[field].checkbox;
            } else if(page.properties[field].type === 'number') {
            page.properties[field] = page.properties[field].number;
            } else if(page.properties[field].type === 'title') {
            page.properties[field] = page.properties[field].title[0].plain_text;
            }else if(page.properties[field].type === 'rich_text') {
            page.properties[field] = page.properties[field].rich_text.map(txt => txt.plain_text)
            }
        }
        return page;
    };

	return my;
}());

module.exports = notionHelper;