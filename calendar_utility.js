const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const {credentials} = require('./calendar_access');

// If modifying these scopes, regenerate token.
const SCOPES = ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/drive'];
const TOKEN_PATH = 'token.txt';
var exclude_calendars = ['Random', 'Skeleton', 'Cofocus', 'University study', 'University study - TLC', 'University study - DIR', 'University study - PAW']

Date.prototype.monthNames = [
    "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
];
Date.prototype.getMonthName = function() {
    return this.monthNames[this.getMonth()];
};
Date.prototype.getShortMonthName = function () {
    return this.getMonthName().substr(0, 3);
};
Date.prototype.getDisplayDate = function() {
	return `${this.getShortMonthName()} ${this.getDate().toString().padStart(2, '0')}`;
};
Date.prototype.getDisplayTime = function() {
	return `${this.getHours().toString().padStart(2, '0')}:${this.getMinutes().toString().padStart(2, '0')}`;
};

function formatEvent(event) {
	const startObj = new Date(event.start.dateTime || event.start.date);
	const endObj = new Date(event.end.dateTime || event.end.date);
	const start = startObj.getDisplayTime();
	const end = startObj.toISOString().split('T')[0].localeCompare(endObj.toISOString().split('T')[0]) === 0 ? endObj.getDisplayTime() : `${endObj.getDisplayDate()} ${endObj.getDisplayTime()}`;
	return `:mdot_blue${new Date() >= endObj ? 'x' : ''}: ${event.summary} @ ${start} - ${end}`;
}

function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }))
}

async function authorize(credentials, user_channel, await_for_token) {
    const {client_secret, client_id, redirect_uri} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uri[0]);
	// Check if we have previously stored a token.
	return new Promise((resolve, reject) => {
		fs.readFile(TOKEN_PATH, async (err, token) => {
			if (err) { // if token not present, generate Auth URL
				let url = await getAccessUrl(oAuth2Client);
				let code = await await_for_token(user_channel, `Authorize the app by visiting the url ${url}`);
				await getAccessToken(code);
			}
			else { // else if token is present
				oAuth2Client.setCredentials(JSON.parse(token));
				resolve(oAuth2Client);
			}
		})
	})
}

async function getAccessUrl(oAuth2Client) {
	const authUrl = oAuth2Client.generateAuthUrl({
	  access_type: 'offline',
	  scope: SCOPES,
	});
	return authUrl;
}

async function getAccessToken(code) {
	const {client_secret, client_id, redirect_uri} = credentials.installed;
	const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uri[0]);
	return new Promise((resolve, reject) => {
		oAuth2Client.getToken(code, (err, token) => {
			if (err) reject(err);
			if (token===null) reject("Bad token key.");
			// Store the token to disk for later program executions
			fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
				if (err) reject(err);
				console.log('Token stored to', TOKEN_PATH);
			});
			resolve("Authenticated.")
		});
	});
}

async function listEvents(authorized, cal={id: 'primary'}) {
	const calendar = google.calendar({version: 'v3', auth: authorized});
	var startOfDay = new Date();
	startOfDay.setHours(0, 0, 0, 0);
	startOfDay = new Date(startOfDay);
	var endOfDay = new Date();
	endOfDay.setHours(23, 59, 59, 999);
	endOfDay = new Date(endOfDay);
	const results = await calendar.events.list({
		// calendarId: 'primary',
		calendarId: cal.id,
		timeMin: startOfDay.toISOString(),
		timeMax: endOfDay.toISOString(),
		singleEvents: true,
		orderBy: 'startTime',
	}).catch(err => console.log('The API returned an error: ' + err));
	return results.data.items;
}

async function listAllEvents(authorized, calendar_list=['primary']) {
	calendar_list = calendar_list.map(function(cal) {
		var tmp = listEvents(authorized, cal);
		return tmp;
	});
	var res = [];
	for(var cal of calendar_list) {
		var tmp = await cal;
		res.push(...tmp);
	}
	res.sort((a, b) => {
		let aTime = new Date(a.start.dateTime || a.start.date);
		let bTime = new Date(b.start.dateTime || b.start.date);
		return aTime - bTime;
	})
	return res;
}

function listCalendars(authorized) {
	const calendar = google.calendar({version: 'v3', auth: authorized});
	return new Promise((resolve, reject) => {
		calendar.calendarList.list({}, (err, res) => {
			if (err) {
				console.log('The API returned an error: ' + err)
				reject('The API returned an error: ' + err)
			}
			var calendars = res.data.items;
			calendars = calendars.map(cal => {
				return {
					name: cal.summary,
					id: cal.id
				}
			}).filter(cal => !exclude_calendars.includes(cal.name));
			resolve(calendars);
		});
	})
}

async function getEvents(authorized, calendar_list=['primary']) {
	var res = [];
	var string = '**EVENTS:**';
	res.push([string, string.length]);
	var allEvents = await listAllEvents(authorized, calendar_list);
	allEvents = allEvents.map(el => {
		string = formatEvent(el);
		return [string, string.length];
	});
	res.push(...allEvents);
	return res;
}
  

async function run() {
	var authorized = await authorize(credentials);
	var cals = await listCalendars(authorized);
	var res = await getEvents(authorized, cals);
	console.log(res);
}

module.exports = {
	authorize,
	getAccessToken,
	listEvents,
	listAllEvents,
	listCalendars,
	getEvents
}