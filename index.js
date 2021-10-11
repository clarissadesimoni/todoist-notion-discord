const express = require('express');
const Discord = require('discord.js');
const discord = new Discord.Client();
var crypto = require('crypto');
const notion = require('./notion_utility'); // can call it like notion.funcName(params);
const todoist = require('./todoist_utility'); // can call it like notion.funcName(params);
// const tasklist = require('./tasklist_utility'); // can call it like notion.funcName(params);
// tasklist.setup();

require('dotenv').config();

const PORT = process.env.PORT || 3000;

var app = express().use(express.urlencoded({ extended: true })).use(express.json());

process.on('unhandledRejection', error => {
    // Will print "unhandledRejection err is not defined"
    console.log('unhandledRejection', error.reason);
});

function message_channel(text) {
    discord.channels.fetch(process.env.LOG_CHANNEL_ID)
        .then(channel => channel.send(text))
        .catch(error => {
            console.log('Error on message_channel function');
            console.log(error.message)
        });
}

function message_embed_channel(msg) {
    discord.channels.fetch(process.env.LOG_CHANNEL_ID)
        .then(channel => channel.send(msg))
        .catch(error => {
            console.log('Error on message_embed_channel function');
            console.log(error.message)
        });
}

function message_user(text) {
    discord.users.fetch(process.env.MY_USER_ID)
        .then(user => user.createDM())
        .then(channel => channel.send(text))
        .catch(error => {
            console.log('Error on message_user function');
            console.log(error.message)
        });
}

function message_embed_user(msg) {
    discord.users.fetch(process.env.MY_USER_ID)
        .then(user => user.createDM())
        .then(channel => channel.send(msg))
        .catch(error => {
            console.log('Error on message_embed_user function');
            console.log(error.message)
        });
}

var todoist_labels = {};
(async () => {
    todoist_labels = await todoist.findAllLabels()
        .catch(error => {
            message_user("Error on getting todoist labels. Check logs for details.");
            console.log('Error on getting todoist labels');
            console.log(error.message)
        });
    message_user('Labels are ready');
})();

discord.on('ready', () => {
    message_user('Hey, The bot is up!');
});

app.get('', (req, res) => {
	res.send('Hello World');
});

app.post('', (req, res) => {
    if(req.get('User-Agent') === 'Todoist-Webhooks') {
        // var delivered_hmac = req.get('X-Todoist-Hmac-SHA256');
        // var computed_hmac = crypto.createHmac('sha256', process.env.TODOIST_CLIENT_SECRET).update(JSON.stringify(req.body)).digest('base64');
        // if(delivered_hmac === computed_hmac) {
            if (req.body.event_name.includes('item')) {
                if(req.body.event_name.includes('item:added') && req.body.event_data.description === '') {
                    var msg = new Discord.MessageEmbed()
                        .setTitle('New task added to Todoist')
                        .addField('Task name', req.body.event_data.content, true)
                        .addField('Task id', `${req.body.event_data.id}`, true);
                    message_embed_channel(msg);
                    message_user(JSON.stringify(req.body.event_data.labels, null, 4));
                    message_user(todoist.getLabel('name', 'Notion').id);
                    message_user(req.body.event_data.labels.includes(todoist.getLabel('name', 'Notion').id));
                    if(req.body.event_data.labels.includes(todoist.getLabel('name', 'Notion').id)) {
                        message_user('Here');
                        notion.createTask(req.body.event_data.content, `${req.body.event_data.project_id}`, req.body.event_data.id, req.body.event_data.due, 5 - req.body.event_data.priority, req.body.event_data.labels.includes(todoist.getLabel('name', 'Discord').id))
                            .then(id => todoist.updateTask(req.body.event_data.id, {description: id}))
                            .then((res) => {
                                if(res) {
                                    message_channel('The task has been added to Notion');
                                } else {
                                    message_user('There was a problem adding the task to Notion');
                                    message_user(error.message);
                                }
                            })
                            .catch((error) => {
                                message_user('There was a problem adding the task to Notion');
                                message_user(error.message);
                            })
                    }
                } else {
                    if(req.body.event_name.includes('item:completed') && req.body.event_data.description !== '') {
                        // this task is completed on todoist but not on notion
                        notion.completeTask(req.body.event_data.description)
                            .then(status => {
                                if(status) {
                                    // later on: create tasklist function
                                    var msg = new Discord.MessageEmbed()
                                        .setTitle('Task completed on Todoist')
                                        .addField('Task name', req.body.event_data.content, true)
                                        .addField('Task id', `${req.body.event_data.id}`, true);
                                    message_embed_channel(msg);
                                    message_channel('You can update your tasklist if you want');
                                } else {
                                    message_user('There was a problem with completing the task on Notion');
                                }
                            })
                            .catch((error) => {
                                message_user('There was a problem completing the task in Notion');
                                message_user(error.message);
                            })
                    } else {
                        if(req.body.event_name.includes('item:updated') && req.body.event_data.description !== '') {
                            var msg = new Discord.MessageEmbed()
                                .setTitle('Task updated in Todoist')
                                .addField('Task name', req.body.event_data.content, true)
                                .addField('Task id', `${req.body.event_data.id}`, true);
                            message_embed_channel(msg);
                            notion.updateTask(req.body.event_data.description, req.body.event_data.content, `${req.body.event_data.project_id}`, req.body.event_data.due, 5 - req.body.event_data.priority, req.body.event_data.labels.includes(todoist.getLabel('name', 'Discord').id))
                                .then(status => {
                                    if(status) {
                                        // later on: create tasklist function
                                        message_channel('You can update your tasklist if you want');
                                    } else {
                                        message_user('There was a problem with updating the task on Notion');
                                    }
                                })
                                .catch((error) => {
                                    message_user('There was a problem updating the task in Notion');
                                    message_user(error.message);
                                })
                        } else {
                            if(req.body.event_name.includes('item:deleted') && req.body.event_data.description !== '') {
                                notion.deleteTask(req.body.event_data.description)
                                    .then(status => {
                                        if(status) {
                                            var msg = new Discord.MessageEmbed()
                                                .setTitle('Task deleted on Todoist')
                                                .addField('Task name', req.body.event_data.content, true)
                                                .addField('Task id', `${req.body.event_data.id}`, true);
                                            message_embed_channel(msg);
                                            message_channel('You can update your tasklist if you want');
                                        } else {
                                            message_user('There was a problem with deleting the task on Notion');
                                        }
                                    })
                                    .catch((error) => {
                                        message_user('There was a problem deleting the task in Notion');
                                        message_user(error.message);
                                    })
                            } else {
                                if(req.body.event_name.includes('item:uncompleted') && req.body.event_data.description !== '') {
                                    notion.uncompleteTask(req.body.event_data.description)
                                        .then(status => {
                                            if(status) {
                                                var msg = new Discord.MessageEmbed()
                                                    .setTitle('Task uncompleted on Todoist')
                                                    .addField('Task name', req.body.event_data.content, true)
                                                    .addField('Task id', `${req.body.event_data.id}`, true);
                                                message_embed_channel(msg);
                                                message_channel('You can update your tasklist if you want');
                                            } else {
                                                message_user('There was a problem with uncompleting the task on Notion');
                                            }
                                        })
                                        .catch((error) => {
                                            message_user('There was a problem uncompleting the task in Notion');
                                            message_user(error.message);
                                        })
                                }
                            }
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
        // } else {
        //     message_user('A 403 (Unauthorized) status code has been sent to a request');
        //     res.status(403).send('Unauthorized');
        //     console.log(`delivered_hmac: ${delivered_hmac}\ncomputed_hmac: ${computed_hmac}\n`)
        //     console.log(req.body);
        // }
    } else {
        message_user('A 400 (Bad request) status code has been sent to a request');
        res.status(400).send('Bad request');
    }
    //handle notion


})


discord.login(process.env.BOT_TOKEN)
    .then(str => {
        todoist.findAllLabels()
        .then(labels => {
            todoist_labels = labels;
            message_user('Everything is ready');
        })
    });

app.listen(PORT, () => {
	console.log(`App up at port ${PORT}`);
});