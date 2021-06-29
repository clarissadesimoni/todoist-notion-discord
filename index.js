const express = require('express');
const Discord = require('discord.js');
const discord = new Discord.Client();
var crypto = require('crypto');
const notion = require('./notion_utility'); // can call it like notion.funcName(params);
const { message } = require('statuses');

require('dotenv').config();

const PORT = process.env.PORT || 3000;

const todoist_label_notion = 2157405300;

app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// process.on('unhandledRejection', error => {
//     // Will print "unhandledRejection err is not defined"
//     console.log('unhandledRejection', error.message);
// });

function message_user(text) {
    discord.users.fetch(process.env.MY_USER_ID).then(user => user.send(text));
}

function message_embed_user(msg) {
    discord.users.fetch(process.env.MY_USER_ID).then(user => user.createDM()).then(channel => channel.send(msg));
}

discord.on('ready', () => {
    message_user('Hey, The bot is up!');
});

app.get('', (req, res) => {
	res.send('Hello World');
});

app.post('', (req, res) => {
    if(req.get('User-Agent') === 'Todoist-Webhooks') {
        var delivered_hmac = req.get('X-Todoist-Hmac-SHA256');
        var computed_hmac = crypto.createHmac('sha256', process.env.TODOIST_CLIENT_SECRET).update(JSON.stringify(req.body)).digest('base64');
        if(delivered_hmac === computed_hmac) {
            if (req.body.event_name.includes('item')) {
                if(req.body.event_name === 'item:added' && req.body.event_data.description === '') {
                    var msg = new Discord.MessageEmbed()
                        .setTitle('New task added to Todoist')
                        .addField('Task name', req.body.event_data.content, true)
                        .addField('Task id', `${req.body.event_data.id}`, true);
                    message_embed_user(msg);
                    
                    if(req.body.event_data.labels.includes(todoist_label_notion)) {
                        notion.createTask(req.body.event_data.content, `${req.body.event_data.project_id}`, eq.body.event_data.id, req.body.event_data.due.date)
                            .then(id => todoist.update(req.body.event_data.id, {description: id}))
                            .then((res) => {
                                if(res) {
                                    message_user('The task has been added to Notion');
                                } else {
                                    message_user('There was a problem adding the task to Notion');
                                }
                            })
                            .catch((error) => {
                                message_user('There was a problem adding the task to Notion');
                                message_user(error.message);
                            })
                    }
                    if(req.body.event_name === 'item:completed' && req.body.event_data.description !== '') {
                        // this task is completed on todoist but not on notion
                        notion.completeTask(req.body.event_data.description).then(status => {
                            if(status === 200) {
                                // later on: create tasklist function
                                message_user('You can update your tasklist if you want');
                            } else {
                                message_user('There was a problem with completing the task on Notion');
                            }
                        })
                    }else {
                        if(req.body.event_name === 'item:updated' && req.body.event_data.description !== '') {
                            var msg = new Discord.MessageEmbed()
                                .setTitle('Task updated in Todoist')
                                .addField('Task name', req.body.event_data.content, true)
                                .addField('Task id', `${req.body.event_data.id}`, true);
                            message_embed_user(msg);
                            notion.updateTask(req.body.event_data.description, req.body.event_data.content, `${req.body.event_data.project_id}`, req.body.event_data.due.date).then(status => {
                                if(status === 200) {
                                    // later on: create tasklist function
                                    message_user('You can update your tasklist if you want');
                                } else {
                                    message_user('There was a problem with updating the task on Notion');
                                }
                            });
                        }
                    }
                }
            } else {
                if(req.body.event_name === 'project:added') {
                    notion.addProject(req.body.event_data.name)
                        .then((id) => {
                            var msg = new Discord.MessageEmbed()
                                .setTitle('New project added to Todoist')
                                .addField('Project name', req.body.event_data.name, true)
                                .addField('Todoist project id', `${req.body.event_data.id}`, true)
                                .addField('Notion project id', `${id}`, true);
                            message_embed_user(msg);
                        })
                }
            }
            // message_user('You can update your tasklist if you want');
            res.status(200).send('Event handled');
        } else {
            message_user('A 403 (Unauthorized) status code has been sent to a request');
            res.status(403).send('Unauthorized');
            console.log(`delivered_hmac: ${delivered_hmac}\ncomputed_hmac: ${computed_hmac}\n`)
            console.log(req.body);
        }
    } else {
        message_user('A 400 (Bad request) status code has been sent to a request');
        res.status(400).send('Bad request');
    }
    //handle notion


})


discord.login(process.env.BOT_TOKEN);
app.listen(PORT, () => {
	console.log(`App up at port ${PORT}`);
});