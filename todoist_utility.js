var todoistHelper = (function () {
	var my = {};

    require('dotenv').config();

    my.api = require('todoist-rest-api').default(process.env.TODOIST_API_KEY).v1;
    
	return my;
}());

module.exports = todoistHelper;