const express = require('express');
const Discord = require('discord.js');
const client = new Discord.Client();
var crypto = require('crypto-js');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

process.on('unhandledRejection', error => {
    // Will print "unhandledRejection err is not defined"
    console.log('unhandledRejection', error.message);
    console.log('Discord token: ' + process.env.BOT_TOKEN)
});

client.on('ready', () => {
    client.users.fetch(process.env.MY_USER_ID).then(user => user.send('Hey, The bot is up!'));
});

app.get('', (req, res) => {
	res.send('Hello World');
});

app.post('', (req, res) => {
    if(req.get('User-Agent') === 'Todoist-Webhooks') {
        var delivered_hmac = req.get('X-Todoist-Hmac-SHA256');
        var computed_hmac = crypto.HmacSHA256(req.body, process.env.TODOIST_CLIENT_SECRET).toString(crypto.enc.Base64);
        if(delivered_hmac === computed_hmac) {
            if(req.body.event_name === 'item:added' && req.body.event_data.description === '') {
                // add task to notion
                // idea: ask user for data
            } else {
                if(req.body.event_name === 'item:completed' && req.body.event_data.description !== '') {
                    // complete task on notion
                }
            }
        } else {
            client.users.fetch(process.env.MY_USER_ID).then(user => user.send('A 403 (Unauthorized) status code has been sent to a request'));
            res.status(403).send('Unauthorized');
            console.log(`delivered_hmac: ${delivered_hmac}\ncomputed_hmac: ${computed_hmac}\n`)
            console.log(req.body);
        }
    } else {
        client.users.fetch(process.env.MY_USER_ID).then(user => user.send('A 400 (Bad request) status code has been sent to a request'));
        res.status(400).send('Bad request');
    }
    //handle notion


    // client.users.fetch(process.env.MY_USER_ID).then(user => user.send('You can update your tasklist if you want'));
	// res.status(200).send('Event handled');
})


client.login(process.env.BOT_TOKEN);
app.listen(PORT, () => {
	console.log(`App up at port ${PORT}`);
});