const app = require('express')();
const Discord = require('discord.js');
const client = new Discord.Client();
var sha256 = require('js-sha256');
const dotenv = require('dotenv');
dotenv.config();

const PORT = process.env.PORT || 3000;

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

app.post('/', (req, res) => {
    if(req.get('User-Agent') === 'Todoist-Webhooks') {
        var delivered_hmac = req.get('X-Todoist-Hmac-SHA256');
        //controllare l'hash
        
    } else {
        res.status(400).send('Bad request');
    }
    //gestire notion


    client.users.fetch('524324225843068941').then(user => user.send('You can update your tasklist if you want'));
	res.status(200).send('Event handled');
})


client.login(process.env);
app.listen(PORT, () => {
	console.log(`App up at port ${PORT}`);
});