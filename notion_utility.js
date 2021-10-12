var notionHelper = (function () {
	var my = {};

    require('dotenv').config();

    const {Client} = require('@notionhq/client');
    my.api = new Client({auth: process.env.NOTION_API_KEY});
    const databases = require('./databases.json')
    const projects = require('./projects.json')

    my.getProject = function(key, target) {
        result = projects.reduce(function (r, a) {
            r[a[key]] = r[a[key]] || [];
            r[a[key]].push(a);
            return r;
        }, Object.create(null));
        return result[target][0];
    }

    my.createTask = async function(name, todoist_project_id, todoist_task_id, do_date, priority, in_discord) {
        var req_body = {
            parent: {
                type: 'database_id',
                database_id: databases.Tasks
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
                            id: my.getProject("todoist_id", todoist_project_id).notion_id
                        }
                    ]
                },
                Priority: {
                    number: priority
                },
                isOnDiscord: {
                    checkbox: in_discord
                }
            }
        }
        if(typeof todoist_task_id !== 'undefined') {
            req_body.properties.TodoistTaskID = {
                number: todoist_task_id
            }
        }
        if(typeof do_date !== 'undefined' && do_date !== null) {
            start_dt = new Date(do_date.date);
            // start_dt.setHours(start_dt.getHours() + 2);
            end_dt = new Date(do_date.date);
            end_dt.setHours(end_dt.getHours() + 24);
            req_body.properties.DoDate = {
                date: {
                    start: start_dt.toISOString().replace(/Z$/, '+02:00'),
                    end: end_dt.toISOString().replace(/Z$/, '+02:00')
                }
            }
        }
        const response = await my.api.pages.create(req_body);
        return response.id;
    }

    my.updateTask = async function(notion_page_id, name, todoist_project_id, do_date, priority, in_discord) {
        console.log(my.getProject("todoist_id", todoist_project_id).notion_id);
        var req_body = {
            page_id: notion_page_id,
            properties: {
                Name: {
                    type: "title",
                    title: [
                        {
                            type: "rich_text",
                            rich_text: {
                                content: name
                            }
                        }
                    ],
                },
                Project: {
                    type: "relation",
                    relation: [
                        {
                            id: my.getProject("todoist_id", todoist_project_id).notion_id
                        }
                    ]
                },
                Priority: {
                    number: priority
                },
                isOnDiscord: {
                    checkbox: in_discord
                }
            }
        }
        if(typeof do_date !== 'undefined' && do_date !== null) {
            start_dt = new Date(do_date.date);
            // start_dt.setHours(start_dt.getHours() + 2);
            end_dt = new Date(do_date.date);
            end_dt.setHours(end_dt.getHours() + 24);
            req_body.properties.DoDate = {
                date: {
                    start: start_dt.toISOString().replace(/Z$/, '+02:00'),
                    end: end_dt.toISOString().replace(/Z$/, '+02:00')
                }
            }
        }
        const response = await my.api.pages.update(req_body);
        return response !== {};
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
        return response !== {};
    }

    my.uncompleteTask = async function (notion_page_id) {
        const response = await my.api.pages.update({
            page_id: notion_page_id,
            properties: {
                Completed: {
                    checkbox: false
                }
            }
        });
        return response !== {};
    }

    my.deleteTask = async function (notion_page_id) {
        const response = await my.api.pages.update({
            page_id: notion_page_id,
            archived: true
        });
        return response !== {};
    }

    my.addProject = async function (name) {
        var req_body = {
            parent: {
                type: 'database_id',
                database_id: databases.Projects
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

    my.getTodaysTask = async function() {
        var req_body = {
            database_id: databases.Tasks,
            filter: {
                property: 'DoDate',
                date: {
                    equals: new Date().toISOString()
                }
            }
        }
        const response = await notion.databases.query(req_body)
            .then(res => res.results.map(result => my.simplifyPage(result)));
        return response;
    }

    my.createLecture = async function(name, mode) {
        start_date = new Date();
        var req_body = {
            parent: {
                type: 'database_id',
                database_id: databases.Lectures
            },
            properties: {
                "Lecture number and topic": {
                    title: [
                        {
                            text: {
                                content: `${name.slice(4)} - `,
                            },
                        },
                    ],
                },
                Course: {
                    relation: [
                        {
                            id: my.getProject("course_code", name.slice(0, 3)).notion_id
                        }
                    ]
                },
                "Date of lecture": {
                    date: {
                        start: start_date.toISOString().split('T')[0]
                    }
                },
                "Class mode": {
                    select: {
                        name: mode
                    }
                },
                "Class type": {
                    select: {
                        name: name[4] === 'L' ? 'Lecture' : 'Practical'
                    }
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