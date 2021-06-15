const app = require('express')();
const Discord = require('discord.js');
const client = new Discord.Client();
var crypto = require('crypto-js');
const dotenv = require('dotenv');
dotenv.config();

const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

process.on('unhandledRejection', error => {
    // Will print "unhandledRejection err is not defined"
    console.log('unhandledRejection', error.message);
});

client.on('ready', () => {
    client.users.fetch('524324225843068941').then(user => user.send('Hey, The bot is up!'));
});

app.get('', (req, res) => {
	res.send('Hello World');
});

app.post('', (req, res) => {
    if(req.get('User-Agent') === 'Todoist-Webhooks') {
        var delivered_hmac = req.get('X-Todoist-Hmac-SHA256');
        var computed_hmac = crypto.HmacSHA256(req.body, "bcf170584a2b4520860ba58a1d9b0119").toString(crypto.enc.Base64);
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
            client.users.fetch('524324225843068941').then(user => user.send('A 403 (Unauthorized) status code has been sent to a request'));
            res.status(403).send('Unauthorized');
        }
    } else {
        client.users.fetch('524324225843068941').then(user => user.send('A 400 (Bad request) status code has been sent to a request'));
        res.status(400).send('Bad request');
    }
    //handle notion


    client.users.fetch('524324225843068941').then(user => user.send('You can update your tasklist if you want'));
	res.status(200).send('Event handled');
})


client.login(process.env);
app.listen(PORT, () => {
	console.log(`App up at port ${PORT}`);
});