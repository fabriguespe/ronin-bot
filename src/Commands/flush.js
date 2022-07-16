const path = require('path');
var secrets = require("../Data/secrets");
const Command = require("../Structures/Command.js");
const Web3 = require('web3');
var utils = require(path.resolve(__dirname, "../utils.js"));

module.exports = new Command({
	name: "flush",
	async run(message, args, client) {
		if(!utils.esManager(message))return message.channel.send("You don't have the propper rights to run this command.")
		let alias=args[1]
		const accountAddress=await utils.getWalletByAlias(alias)
		console.log(accountAddress)
		let data=await utils.getSLP(accountAddress,null,false)
		console.log(data)
		if(data.in_game_slp>0){		
			message.channel.send(alias+': '+data.in_game_slp+' SLP found to claim')
			await utils.claim(data,message)
		}else utils.log(alias+":No SLP to claim",message)
		
		data=await utils.getSLP(accountAddress,null,false)
		console.log(data)
		if(data.ronin_slp>0){			
			message.channel.send(alias+': '+data.ronin_slp+' SLP found to transfer')
			await utils.transfer(accountAddress,await utils.getWalletByAlias("main"),ronin_slp,message)	
		}else utils.log(alias+":No SLP to transfer",message)

		
	}
});
