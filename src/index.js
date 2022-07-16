console.clear();
const path = require('path');
var utils = require(path.resolve(__dirname, "./utils.js"));
const Client = require(path.resolve(__dirname, "./Structures/Client.js"));
const config = require(path.resolve(__dirname, "./Data/config.json"));
const client = new Client();
const fs = require("fs");
fs.readdirSync(__dirname+"/Commands")
.filter(file => file.endsWith(".js"))
.forEach(file => {
	const command = require(__dirname+`/Commands/${file}`);
	console.log(`Command ${command.name} loaded`);
	client.commands.set(command.name, command);
});

client.on("ready", message => {
	console.log('init')
})

client.on("messageCreate", message => {
	if(message.author.bot) return;
	let prefix=utils.isTesting()?'!!':config.prefix
	if(message.content && !message.content.startsWith(prefix))return;

	const args = message.content.substring(prefix.length).split(/ +/);
	const command = client.commands.find(cmd => cmd.name == args[0]);
	if(command)command.run(message, args, client);
});

client.login(config.token);
