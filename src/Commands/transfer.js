const path = require('path');
const Command = require("../Structures/Command.js");
const fetch = require( "node-fetch")
var utils = require(path.resolve(__dirname, "../utils.js"));

module.exports = new Command({
	name: "transfer",
	async run(message, args, client) {
		if(!utils.esManager(message))return message.channel.send("You don't have the propper rights to run this command.")
        if(args.length==5)return message.channel.send("Command is incorrect, check spelling,qty of parameters, etc")
        let from=args[3]
        let to=args[4]

        if(args[1]=='axie'){
            let user_from=await utils.getWalletByAlias(from)
            let user_to=await utils.getWalletByAlias(to)
            let axies_ids=args[2].split(",");
            try{    
                for(let i in axies_ids){
                    let axie_id=axies_ids[i]
                    await utils.transferAxie(user_from,user_to,num_from,num_to,axie_id,message)
                }
                utils.log("Success!",message);     
            }catch{
                utils.log("Error",message);     
            }
        }else if(args[1]=='slp'){

            let qty=args[2]
            let from_acc=await utils.getWalletByAlias(from)
            let to_acc=await utils.getWalletByAlias(to)
            from_acc=from_acc.replace('ronin:','0x')
            to_acc=to_acc.replace('ronin:','0x')

            await utils.transfer(from_acc,to_acc,qty,message)

        }else if(args[1]=='usd'){

            let qty=args[2]
            let url = "https://api.coingecko.com/api/v3/simple/price?ids=smooth-love-potion&vs_currencies=usd";
            let slp_price= await fetch(url, { method: "Get" }).then(res => res.json()).then((json) => { return (Object.values(json)[0].usd)});
            qty=Math.round(qty/slp_price)
            console.log(from,to)
            let from_acc=await utils.getWalletByAlias(from)
            let to_acc=await utils.getWalletByAlias(to)
            from_acc=from_acc.replace('ronin:','0x')
            to_acc=to_acc.replace('ronin:','0x')

            await utils.transfer(from_acc,to_acc,qty,message)
        }
	}
});
