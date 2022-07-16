const path = require('path');
const Command = require("../Structures/Command.js");
const { MessageEmbed} = require('discord.js');
var utils = require(path.resolve(__dirname, "../utils.js"));

module.exports = new Command({
	name: "claim",
	async run(message, args, client) {
		if(args.length!=3) return message.channel.send(`Incomplete command`);
		if(!utils.esManager(message))return message.channel.send("You don't have the propper rights to run this command.")
		
		let alias=args[1]
		let data=await utils.claimData(alias,message,true)
		if(!(data.hours>0 && !data.has_to_claim) && data.jugador_slp>0){
			let fallo=await utils.cobro(data,message)
			if(!fallo)message.channel.send('Success')
		}

	}
});
