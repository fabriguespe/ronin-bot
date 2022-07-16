const path = require('path');
const Command = require("../Structures/Command.js");
const { MessageEmbed} = require('discord.js');
var utils = require(path.resolve(__dirname, "../utils.js"));

module.exports = new Command({
	name: "balance",
	async run(message, args, client) {
		if(args.length!=3) return message.channel.send(`Incomplete command`);
		if(!utils.esManager(message))return message.channel.send("You don't have the propper rights to run this command.")
		
		const alias=args[2]
		const token=args[1]

		const bal=await utils.balance(token,alias)
		message.channel.send('Balance '+token+' '+bal)
	}
});
