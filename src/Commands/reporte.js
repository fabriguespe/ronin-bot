const path = require('path');
const Command = require("../Structures/Command.js");
const { MessageEmbed} = require('discord.js');
var utils = require(path.resolve(__dirname, "../utils.js"));

module.exports = new Command({
	name: "reporte"+(process.env.LOGNAME=='fabrizioguespe'?'t':''),
	async run(message, args, client) {
		if(!utils.esManager(message))return message.channel.send("You don't have the propper rights to run this command.")
		try{
			let data=''
			let accountAddress=''
			
			let axie_count=0
			if(args.length==2 || args.length==3){
				message.channel.send("Aguarde un momento...")
				let axies=await utils.getAxiesIds(accountAddress.replace('ronin:','0x'))
				let axiesdata=[]

				if(axies && axies.axies){
					for(let i in axies.axies){
						let axie=axies.axies[i]
						let pushed={}
						pushed.id=axie.id
						pushed.url= 'https://marketplace.axieinfinity.com/axie/'+axie.id
						pushed.hijos=axie.breedCount
						pushed.image=axie.image
						pushed.tipo=axie.class
						let espalda=axie.parts.find(x => x.type == "Back").name
						let boca=axie.parts.find(x => x.type == "Mouth").name
						let cuerno=axie.parts.find(x => x.type == "Horn").name
						let cola=axie.parts.find(x => x.type == "Tail").name
						pushed.partes={espalda:espalda,boca:boca,cuerno:cuerno,cola:cola}
						axiesdata.push(pushed)
						axie_count++
					}
				}
				
				let slp=await utils.getSLP(accountAddress,message,false)

				let exampleEmbed = new MessageEmbed().setColor('#0099ff').setTitle('Jugador #'+args[1]+' ('+axie_count+' Axies)')
				exampleEmbed.addFields(
					//{ name: 'Precio', value: ''+slp+'USD'},
					{ name: 'SLP Total', value: ''+slp.in_game_slp,inline:true},
					{ name: 'Nombre', value: ''+eluser.name,inline:true},
					{ name: 'Copas', value: ''+(slp.mmr?slp.mmr:'Error'),inline:true},
					{ name: 'Ultimo reclamo', value: ''+utils.FROM_UNIX_EPOCH(slp.last_claim),inline:true},
					{ name: 'Proximo', value: ''+utils.ADD_DAYS_TO_UNIX(slp.last_claim,15),inline:true},
					{ name: 'Estado', value: ''+eluser.nota,inline:true},
				)
				
				exampleEmbed.addFields(
					{ name: 'Wallet', value: '[Link](https://explorer.roninchain.com/address/'+accountAddress+")",inline:true},
					{ name: 'JSON', value: '[Link](https://game-api.axie.technology/api/v1/'+accountAddress+")",inline:true},
					{ name: 'Axies '+'('+axie_count+')', value: '[Link](https://marketplace.axieinfinity.com/profile/'+accountAddress+")",inline:true},
					{ name: 'Pass', value: ''+eluser.pass,inline:true},
					{ name: 'Puesto', value: 'AxieMasterC',inline:true},
					{ name: 'Discord', value: ''+eluser.discord,inline:true},
					{ name: 'Binance', value: ''+eluser.scholarPayoutAddress,inline:true},
					{ name: 'Registros', value: ''+help},
				)
				message.channel.send({ embeds: [exampleEmbed] });
				
				if(args[2]=='axies'){

					let exampleEmbed = new MessageEmbed().setColor('#0099ff').setTitle('Axies #'+args[1])
					for(let i in axiesdata)exampleEmbed.addFields({ name: axiesdata[i].tipo, value: axiesdata[i].partes.cola+'\n'+axiesdata[i].partes.espalda+'\n'+axiesdata[i].partes.cuerno+'\n'+axiesdata[i].partes.boca+'\n'+'[Link]('+axiesdata[i].url+")",inline:true})
					message.channel.send({ embeds: [exampleEmbed] });
	
				}

	
			}else{
				message.channel.send(`Comando incompleto`);
			}
		}catch(e){
			utils.log(e,message)
		}

	}
});
