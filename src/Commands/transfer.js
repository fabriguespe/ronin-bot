const path = require('path');
const Command = require("../Structures/Command.js");
const fetch = require( "node-fetch")
var utils = require(path.resolve(__dirname, "../utils.js"));

module.exports = new Command({
	name: "transfer",
	async run(message, args, client) {
		if(!utils.esManager(message))return message.channel.send("You don't have the propper rights to run this command.")
        if(args.length!=5)return message.channel.send("Command is incorrect, check spelling,qty of parameters, etc")
        let from=args[3]
        let to=args[4]

        if(args[1]=='axie'){
            let axies_ids=args[2].split(",");
            for(let i in axies_ids){
                let axie_id=axies_ids[i]
                await utils.transferAxie(from,to,axie_id,message)
            } 
        }else if(args[1]=='slp' || args[1]=='axs' || args[1]=='weth' || args[1]=='ron'){

            let qty=args[2]
            await utils.transfer(args[1],from,to,qty,message)

        }else if(args[1]=='usd'){

            let qty=args[2]
            let url = "https://api.coingecko.com/api/v3/simple/price?ids=smooth-love-potion&vs_currencies=usd";
            let slp_price= await fetch(url, { method: "Get" }).then(res => res.json()).then((json) => { return (Object.values(json)[0].usd)});
            qty=Math.round(qty/slp_price)
            await utils.transfer(from,to,qty,message)
        }
	}
});
