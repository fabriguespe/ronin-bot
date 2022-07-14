const Command = require("../Structures/Command.js");

module.exports = new Command({
	name: "help"+(process.env.LOGNAME=='fabrizioguespe'?'t':''),
	async run(message, args, client) {
		//Copiar desde aca
		let slpp=0
		
		let user=users[i]
		if(!user.accountAddress || user.accountAddress.length!=46)return
		if(typeof args !== 'undefined' && args[2] && user.num!=args[2])return
		let data=await utils.getSLP(user.accountAddress,null,false)
		user.in_game_slp=data.in_game_slp
		console.log(user.num,data.in_game_slp)
		if(data.in_game_slp>0){		
			slpp+=data.in_game_slp
			message.channel.send('#'+user.num+': Se encontraron '+user.in_game_slp+' SLP sin reclamar')
			try{
				await utils.claim(user,message)
			}catch (e) {
				utils.log(e,message)
			}
		}	
		
		if(typeof message !== 'undefined' && message.channel)utils.log(slpp +'SLP totales con una cantidad de registros: '+users.length,message);

		slpp=0
		if(typeof message !== 'undefined' && message.channel)message.channel.send('Revisando las wallets...')
		for(let i in users){
			let user=users[i]
			if(!user.accountAddress || user.accountAddress.length!=46)continue
			if(typeof args !== 'undefined' && args[2] && user.num!=args[2])continue
			let data=await utils.getSLP(user.accountAddress,null,false)
			console.log(user.num,data.ronin_slp)
			user.ronin_slp=data.ronin_slp
			if(data.ronin_slp>0){			
				slpp+=data.ronin_slp
				message.channel.send('#'+user.num+': Se encontraron '+user.ronin_slp+' SLP para transferir')
				try{	
					await utils.transfer(user.accountAddress,await utils.getWalletByNum("BREED"),user.ronin_slp,message)
				}catch (e) {
					utils.log(e,message)
				}
			}
		}
		
		if(typeof message !== 'undefined' && message.channel)utils.log(slpp +'SLP totales con una cantidad de registros: '+users.length,message);
		
	}
});
