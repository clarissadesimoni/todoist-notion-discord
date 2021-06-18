var notionHelper = (function () {
	var my = {};

    require('dotenv').config();

    my.api = new require('@notionhq/client').constructor({auth: process.env.NOTION_API_KEY});
    my.completeTask = async function (notion_page_id) {
        const response = await my.api.pages.update({
            page_id: notification_page_id,
            properties: {
                Completed: {
                    checkbox: true
                }
            }
        });
        return response.status;
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