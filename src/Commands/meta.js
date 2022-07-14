/** @format */
const path = require('path');

const Command = require("../Structures/Command.js");
const {MessageEmbed} = require('discord.js');
var utils = require(path.resolve(__dirname, "../utils.js"));

module.exports = new Command({
	name: "meta"+(process.env.LOGNAME=='fabrizioguespe'?'t':''),
	async run(message, args, client) {
		if(!utils.esManager(message))return message.channel.send("You don't have the propper rights to run this command.")
		
		try{
			let users=[]
			if(args[1]!=undefined)users=await db.collection('users').find({num:"215"}).toArray()
			else users=await db.collection('users').find({}).toArray()


			users=users.sort(function(a, b) {return parseInt(a.num) - parseInt(b.num)});

			if(typeof message !== 'undefined' && message.channel)message.channel.send('Se empezara a procesar')
			let datos={total:0,energias:0,normal:0,raros:'',pro40:0,pro60:0,energias:0,buenos:17,libres:0,breed:0,fijos40:0,fijos60:0}
			datos.total=datos.energias+datos.buenos
			let meta={}
			for(let i in users){
				let user=users[i]
				if(user.num=='2' || user.num=='1')continue
				let axies=await utils.getAxiesIds(user.accountAddress.replace('ronin:','0x'))
				if(axies && axies.axies){
					//Omitir
					
					let total=axies.axies.length
					if(total==0)continue
					datos.total+=total


					//META
					let metas=[]
					if(user.meta && total==10)metas=user.meta
					else{
						for(let j in axies.axies){
							let axie=axies.axies[j]
							let clase=axie.class
							if(clase=='Plant')clase='Planta'
							else if(clase=='Plant')clase='Planta'
							else if(clase=='Aquatic')clase='Pez'
							else if(clase=='Bird')clase='Ave'
							else if(clase=='Reptile')clase='Reptil'
							else if(clase=='Beast')clase='Bestia'
							else if(clase=='Dusk')clase='Tierra'
							else if(clase=='Bug')clase='Bicho'
							metas.push(clase)
						}
						metas=metas.sort().join('-')
					}
					

					//Types compbinations
					if(!Object.keys(meta).includes(metas))meta[metas]=1
					else meta[metas]++
					
					//Count
					if(total==10)datos.energias+=7
					else if(total==20)datos.energias+=17

					if(total==10 && user.nota=='pro')datos.pro40+=1
					else if(total==20 && user.nota=='pro')datos.pro60+=1
					else if(total==10 && user.nota=='fijo')datos.fijos40+=1
					else if(total==20 && user.nota=='fijo')datos.fijos60+=1
					else if(total==3 &&  user.nota=='libre')datos.libres+=1
					else if(total==3 &&  user.nota=='aprobado')datos.normal+=1

					//Log
					if(total==3 && user.nota!='retiro')continue
					else if((total==20 || total==10) && user.nota=='pro')continue
					else if((total==20 || total==10) && user.nota=='fijo')continue
					let value=('#'+user.num+': Se encontraron '+total+' Axies | '+user.nota)
					datos.raros+=value+'\n'
				}
			}
			let embed = new MessageEmbed().setTitle('Casos').setDescription(datos.raros).setColor('GREEN').setTimestamp()
			message.channel.send({content: ` `,embeds: [embed]})
			embed = new MessageEmbed().setColor('#0099ff')
			embed = embed.addFields(
				{ name: 'Axies Totales', value: ''+datos.total,inline:true},
				{ name: '20 Energias', value: ''+(datos.normal),inline:true},
				{ name: 'Pro 40', value: ''+datos.pro40,inline:true},
				{ name: 'Pro 60', value: ''+datos.pro60,inline:true},/*
				{ name: 'Cuentas Libres', value: ''+(datos.libres),inline:true},
				{ name: 'Axies Libres', value: ''+(datos.libres+datos.buenos),inline:true},
				{ name: 'Axies Energias', value: ''+datos.energias,inline:true},*/
				{ name: 'Fijos 40 ', value: ''+(datos.fijos40),inline:true},
				{ name: 'Fijos 60 ', value: ''+(datos.fijos60),inline:true},
			)
			if(args[1]==undefined)message.channel.send({content: ` `,embeds: [embed]})
			
			let msg=''
			for(let i in meta)if(meta[i]>0)msg+=i+' '+meta[i]+'\n'
			embed = new MessageEmbed().setTitle('Metas').setDescription(msg).setColor('#0099ff').setTimestamp()
			//message.channel.send({content: ` `,embeds: [embed]})
			msg=''

			

			msg=''
			users=users.sort(function(a, b) {return (a.meta) - (b.meta)});
			for(let i in users)if(users[i].nota=='pro')msg+='#'+users[i].num+' '+users[i].name+' '+users[i].meta+'\n'
			embed = new MessageEmbed().setTitle('Cuentas Pro').setDescription(msg).setColor('#0099ff').setTimestamp()
			message.channel.send({content: ` `,embeds: [embed]})
			
			msg=''
			users=users.sort(function(a, b) {return (a.puesto) - (b.puesto)});
			for(let i in users)if(users[i].nota=='fijo')msg+='#'+users[i].num+' '+users[i].name+' '+users[i].puesto+'\n'

			
			embed = new MessageEmbed().setTitle('Cuentas Fijas').setDescription(msg).setColor('#0099ff').setTimestamp()
			message.channel.send({content: ` `,embeds: [embed]})

		}catch (e) {
			utils.log(e,message)
		}
	}
});
