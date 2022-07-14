
const path = require('path');
var secrets = require(path.resolve(__dirname, "./Data/secrets"));
const fetch = require( "node-fetch")
var slp_abi = require(path.resolve(__dirname, "./ABI/slp_abi.json"));
var balance_abi = require(path.resolve(__dirname, "./ABI/balance_abi.json"));
const Web3 = require('web3');
var axie_abi = require(path.resolve(__dirname, "./ABI/axie_abi.json"));
const {MessageEmbed} = require('discord.js');

TABULADORES={uno:60,dos:45,tres:35,cuatro:25}
DISCORD_JSON=877625345996632095//jeisson
DISCORD_FABRI=533994454391062529

USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/36.0.1944.0 Safari/537.36"
TIMEOUT_MINS = 5
AXIE_CONTRACT = "0x32950db2a7164ae833121501c797d79e7b79d74c"
AXS_CONTRACT = "0x97a9107c1793bc407d6f527b77e7fff4d812bece"
SLP_CONTRACT = "0xa8754b9fa15fc18bb59458815510e40a12cd2014"
WETH_CONTRACT = "0xc99a6a985ed2cac1ef41640596c5a5f9f4e19ef5"
RONIN_PROVIDER_FREE = "https://proxy.roninchain.com/free-gas-rpc"
RONIN_PROVIDER = "https://api.roninchain.com/rpc"


var log4js = require("log4js");
log4js.configure({appenders: { cheese: { type: "file", filename: "log.log" } },categories: { default: { appenders: ["cheese"], level: "error" } }});
var logger = log4js.getLogger();
logger.level = "debug";

module.exports = {
    parseDate:function(dateStr, locale){
        if(!dateStr)return 0
        var initial =dateStr.split(/\//);
        let final=[ initial[1], initial[0], initial[2] ].join('/'); 
        return new Date(final);     
    },
    esFechaCobros(){
        let today = new Date(Date.UTC(0, 0, 0, 0, 0, 0));
        let diadelmes=today.getDate()
        let lastDayOfMonth = new Date(today.getFullYear(), today.getMonth()+1, 0).getDate()
        if((diadelmes>=(lastDayOfMonth-3) &&  diadelmes<=lastDayOfMonth) || diadelmes>=15 &&  diadelmes<=16) return true
        return false
    },
    getNumberOfDays(start, end) {
        const date1 = new Date(start);
        const date2 = new Date(end);
    
        // One day in milliseconds
        const oneDay = 1000 * 60 * 60 * 24;
    
        // Calculating the time difference between two dates
        const diffInTime = date2.getTime() - date1.getTime();
    
        // Calculating the no. of days between two dates
        const diffInDays = Math.round(diffInTime / oneDay);
    
        return diffInDays;
    },    
    HOURS_NEXT_CLAIM:function(epoch_in_secs){
        let today = new Date();
        let next_claim = new Date(epoch_in_secs * 1000)
        next_claim.setDate(next_claim.getDate() + 15)
        let diffInMilliSeconds=next_claim.getTime()-today.getTime()
        let hours = (diffInMilliSeconds /1000 / 3600).toFixed(2)
        return hours
    },
    FROM_UNIX_EPOCH:function(epoch_in_secs){
        return new Date(epoch_in_secs * 1000).toLocaleString("es-ES", {timeZone: "America/Caracas"})
    },
    ADD_DAYS_TO_UNIX_DATE:function(epoch_in_secs,days){
        let last_claim = new Date(epoch_in_secs * 1000)
        last_claim.setDate(last_claim.getDate() + days)
        return last_claim
    },
    ADD_DAYS_TO_UNIX:function(epoch_in_secs,days){
        let last_claim = new Date(epoch_in_secs * 1000)
        last_claim.setDate(last_claim.getDate() + days)
        return last_claim.toLocaleString("es-ES", {timeZone: "America/Caracas"})
    },
    async crearCanalSoporte(num,message){
		let rSoporte = message.guild.roles.cache.find(r => r.name === "Soporte");
		let rCategoria = message.guild.channels.cache.find(c => c.id == (args[1]?921106145811263499:utils.esJugador(message)?866879155350143006:909634641030426674) && c.type=='GUILD_CATEGORY');
        let thread=await message.guild.channels.create('ayuda-', { 
        type: 'GUILD_TEXT',parent:rCategoria?rCategoria.id:null,permissionOverwrites: [{id: message.author.id,allow: ['VIEW_CHANNEL']},{id: rSoporte.id,allow: ['VIEW_CHANNEL']},{id: message.guild.roles.everyone.id,deny: ['VIEW_CHANNEL']},
        ]}).then(chan=>{return chan})

        embed = new MessageEmbed().setTitle('Ticket')
		.setDescription(`Hola ${message.author}, soy Roni. \nPor favor seleccioná una opción tocando el boton correspondiente\nROL:`+(utils.esJugador(message)?'Jugador':'Sin Rol')).setColor('GREEN').setTimestamp()
		await thread.send({content: ` `,embeds: [embed],components: [row] })

    },
    mensajeIngresos(tit,msg,message){

        let embed = new MessageEmbed().setTitle(tit).setDescription(msg).setColor('GREEN').setTimestamp()
        let rCanal = message.guild.channels.cache.find(c => c.id == 909165024642203658);//canal ingresos
        rCanal.send({content: ` `,embeds: [embed]})
    },
    claim:async function (data,message){
        try{
            let from_acc=data.accountAddress
            from_acc=from_acc.replace('ronin:','0x')
            let from_private = secrets[(from_acc.replace('0x','ronin:'))]    
            let random_msg=await this.create_random_msg()
            let jwt=await this.get_jwt(from_acc,random_msg,from_private)
            let jdata=await fetch("https://game-api.skymavis.com/game-api/clients/"+from_acc+"/items/1/claim", { method: 'post', headers: { 'User-Agent': USER_AGENT, 'authorization': 'Bearer '+jwt},body: ""}).then(response => response.json()).then(data => { return data});
            
            let signature=jdata.blockchain_related.signature
            const web3 = await new Web3(new Web3.providers.HttpProvider(RONIN_PROVIDER_FREE));
            let contract = new web3.eth.Contract(slp_abi,web3.utils.toChecksumAddress(SLP_CONTRACT))
            let nonce = await web3.eth.getTransactionCount(from_acc, function(error, txCount) { return txCount}); 
            
            
            //build
            let myData=contract.methods.checkpoint(
                (web3.utils.toChecksumAddress(from_acc)),
                signature['amount'],
                signature['timestamp'],
                signature['signature']).encodeABI()
            
            let trans={
                    "chainId": 2020,
                    "gas": 492874,
                    "from": from_acc,
                    "gasPrice":await web3.utils.toWei("1", "gwei"),
                    "value": 0, 
                    "to": SLP_CONTRACT,
                    "nonce": nonce,
                    data:myData
            }
            //CLAIM
            message.channel.send("Realizando el claim de "+data.in_game_slp+" SLP...");
            let signed  = await web3.eth.accounts.signTransaction(trans, from_private)
            let tr_raw=await web3.eth.sendSignedTransaction(signed.rawTransaction)


            if(tr_raw.status){            
                let embed = new MessageEmbed().setTitle('Exito!').setDescription("La transacción se procesó exitosamente. [Ir al link]("+"https://explorer.roninchain.com/tx/"+tr_raw.transactionHash+")").setColor('GREEN').setTimestamp()
                message.channel.send({content: ` `,embeds: [embed]})
                logger.debug({tx:tr_raw.transactionHash,type:'slp_claim',timestamp:this.timestamp_log(),date:this.date_log(), slp:data.in_game_slp,num:data.num,from_acc:from_acc})
                return true
            }  
            return null
        }catch(e){
            this.log(e,message)
        }
    },
    isTesting(){
        if(process.env.LOGNAME=='fabrizioguespe')return true
        return false
    },
    isProFabri(num){
        return false//para recordar mis cuentas
        //mios son 6 equipos puros y 28 tutis
        return num=='43' || num=='186' || num=='187'|| num=='45'  || num=='21'  
    },
    cobroRoni:async function(data,message){

        try{
            if(data.in_game_slp>0)await this.claim(data,message)
            let slp_total=data.in_game_slp+data.ronin_slp
            let roni_wallet=await this.getWalletByNum("BREED")
            roni_wallet=roni_wallet.replace('ronin:','0x')
            let fallo=false
            try{
                let tx=await this.transfer(data.accountAddress,(roni_wallet),(slp_total),message)
                if(tx)logger.debug({tx:tx,type:'slp_ronimate',timestamp:this.timestamp_log(),date:this.date_log(),num:data.num, slp:(slp_total),num:data.num,from_acc:data.accountAddress,wallet:(roni_wallet)})
                
            }catch(e){
                fallo=true
                this.log(e,message)
            }
            return fallo
             
        }catch(e){
            this.log(e,message)
        }
    },cobro:async function(data,message){

        try{
            if(data.in_game_slp>0)await this.claim(data,message)
            let slp_total=data.in_game_slp+data.ronin_slp
            let roni_slp=slp_total-data.jugador_slp
            let jugador_slp=data.jugador_slp
            if(roni_slp==jugador_slp)roni_slp-=1
            let roniPrimero=(roni_slp>=jugador_slp)
            if(!data.scholarPayoutAddress)return message.channel.send("Wallet de cobro no existente")
            let player_wallet=data.scholarPayoutAddress.replace('ronin:','0x')
            let roni_wallet=await this.getWalletByNum("BREED")
            roni_wallet=roni_wallet.replace('ronin:','0x')
            let fallo=false
            try{
                let tx=await this.transfer(data.accountAddress,(roniPrimero?roni_wallet:player_wallet),(roniPrimero?roni_slp:jugador_slp),message)
                if(tx)logger.debug({tx:tx,type:'slp_'+(roniPrimero?'ronimate':'jugador'),timestamp:this.timestamp_log(),date:this.date_log(),num:data.num, slp:(roniPrimero?roni_slp:jugador_slp),num:data.num,from_acc:data.accountAddress,wallet:(roniPrimero?roni_wallet:player_wallet)})
                
            }catch(e){
                fallo=true
                this.log(e,message)
            }
            roniPrimero=!roniPrimero
            try{
                let tx=await this.transfer(data.accountAddress,(roniPrimero?roni_wallet:player_wallet),(roniPrimero?roni_slp:jugador_slp),message)
                
            }catch(e){
                fallo=true
                this.log(e,message)
            }

            return fallo
             
        }catch(e){
            this.log(e,message)
        }
    },
    timestamp_log:function(){
        return new Date(Date.now())
    },date_log:function(){
        return new Date().getDate()+'/'+(new Date().getMonth()+1)+'/'+new Date().getFullYear()
    },
    transferAxie:async function(from_acc,to_acc,num_from,num_to,axie_id,message){
        if(!this.isSafe(from_acc) || !this.isSafe(to_acc))return message.channel.send(`Una de las wallets esta mal!`);
        try{
            
            const web3 = await new Web3(new Web3.providers.HttpProvider(RONIN_PROVIDER_FREE));
            let from_private = secrets[(from_acc.replace('0x','ronin:'))]
            let axie_contract = new web3.eth.Contract(axie_abi,web3.utils.toChecksumAddress(AXIE_CONTRACT))
            let nonce = await web3.eth.getTransactionCount(from_acc, function(error, txCount) { return txCount}); 
            let myData=axie_contract.methods.safeTransferFrom((web3.utils.toChecksumAddress(from_acc)),(web3.utils.toChecksumAddress(to_acc)),(axie_id)).encodeABI()
            
            let trans={
                    "chainId": 2020,
                    "gas": 492874,
                    "from": from_acc,
                    "gasPrice":await web3.utils.toWei("1", "gwei"),
                    "value": 0,
                    "to": AXIE_CONTRACT,
                    "nonce": nonce,
                    data:myData
            }
            console.log(trans)
                 
            message.channel.send("Success para transferir el Axie: "+axie_id+"\nAguarde un momento...");
            let signed  = await web3.eth.accounts.signTransaction(trans, from_private)
            let tr_raw=await web3.eth.sendSignedTransaction(signed.rawTransaction)
            
            if(tr_raw.status){            
                let embed = new MessageEmbed().setTitle('Exito!').setDescription("La transacción se procesó exitosamente. [Ir al link]("+"https://explorer.roninchain.com/tx/"+tr_raw.transactionHash+")").setColor('GREEN').setTimestamp()
				logger.debug({tx:tr_raw.transactionHash,type:'axie_transfer',timestamp:this.timestamp_log(),date:this.date_log(), axie_id:axie_id,num_from:num_from,num_to:num_to,from_acc:from_acc,to_acc:to_acc})
                return message.channel.send({content: ` `,embeds: [embed]})
            }        
            else message.channel.send("ERROR Status False");
        }catch(e){
            this.log(e,message)
        }
    },
    transfer:async function(from_acc,to_acc,balance,message){
        try{
            from_acc=from_acc.replace('ronin:','0x')
            to_acc=to_acc.replace('ronin:','0x')

            const web3 = await new Web3(new Web3.providers.HttpProvider(RONIN_PROVIDER_FREE));
            let nonce = await web3.eth.getTransactionCount(from_acc, function(error, txCount) { return txCount}); 
            //nonce+=nonceplus
            let contract = new web3.eth.Contract(slp_abi,web3.utils.toChecksumAddress(SLP_CONTRACT))
            
            let myData=contract.methods.transfer((web3.utils.toChecksumAddress(to_acc)),balance).encodeABI()
            
            let trans={
                "chainId": 2020,
                "gas": 492874,
                "from": from_acc,
                "gasPrice":await web3.utils.toWei("1", "gwei"),
                "value": 0,
                "to": SLP_CONTRACT,
                "nonce": nonce,
                data:myData
            }
    
            let breed=await this.getWalletByNum("BREED")
            breed=breed.replace('ronin:','0x')
            if(to_acc==breed)message.channel.send("Estamos procesando la transacción....");
            else message.channel.send("Enviando "+balance+" SLP a la cuenta del jugador");
            
            
            let from_private = secrets[(from_acc.replace('0x','ronin:'))]    
            let signed  = await web3.eth.accounts.signTransaction(trans, from_private)
            let tr_raw=await web3.eth.sendSignedTransaction(signed.rawTransaction)
            

            if(tr_raw.status){
                let tx=tr_raw.transactionHash
                let embed = new MessageEmbed().setTitle('Exito!').setDescription("La transacción se procesó exitosamente. [Ir al link]("+"https://explorer.roninchain.com/tx/"+tx+")").setColor('GREEN').setTimestamp()
                message.channel.send({content: ` `,embeds: [embed]})   
                return tx
            }else return false          
        }catch(e){
            this.log("ERROR:"+e.message,message)
        }
    },
    balance:async function(from_acc, token='slp'){
        let contract = SLP_CONTRACT
        /*if(token == 'slp') contract = SLP_CONTRACT
        else if(token == 'axs') contract = AXS_CONTRACT
        else if(token == "axies")contract = AXIE_CONTRACT
        else if(token == "weth")contract = WETH_CONTRACT
        else return 0
        console.log(token,contract)*/
        const web3 = await new Web3(new Web3.providers.HttpProvider(RONIN_PROVIDER));
        contract = new web3.eth.Contract(balance_abi,web3.utils.toChecksumAddress(contract))
        let balance = await  contract.methods.balanceOf( web3.utils.toChecksumAddress(from_acc.replace("ronin:", "0x"))).call()
        return balance
    },
    getMMR:async function(from_acc,message,cache=false){
        try{
            from_acc=from_acc.replace('ronin:','0x')  
            let data= await fetch("https://game-api.axie.technology/api/v2/"+from_acc.replace('0x','ronin:') , { method: "Get" }).then(res => res.json()).then((json) => { return json});
            return data.mmr

        }catch(e){
            this.log(e,message)
        }
    },
    getSLP:async function(from_acc,message=null,cache=false){
        try{
            let data={}
            if(!cache) {
                //console.log("https://game-api.skymavis.com/game-api/clients/"+from_acc.replace('ronin:','0x')+"/items/1")
                let jdata=await fetch("https://game-api.skymavis.com/game-api/clients/"+from_acc.replace('ronin:','0x')+"/items/1").then(response => response.json()).then(data => { return data});     
                if(!jdata || !jdata.blockchain_related){
                    //console.log(jdata)
                    jdata=await fetch("https://game-api.skymavis.com/game-api/clients/"+from_acc.replace('ronin:','0x')+"/items/1").then(response => response.json()).then(data => { return data});  
                    if(!jdata || !jdata.blockchain_related){   
                        jdata=await fetch("https://game-api.skymavis.com/game-api/clients/"+from_acc.replace('ronin:','0x')+"/items/1").then(response => response.json()).then(data => { return data});  
                        if(!jdata || !jdata.blockchain_related){   
                            this.log("error: "+from_acc)
                            return null
                        }
                    }
                }
                let balance=jdata.blockchain_related.balance
                let total=jdata.total-jdata.blockchain_related.balance
                data= {in_game_slp:total,ronin_slp:balance?balance:0,last_claim:jdata.last_claimed_item_at,has_to_claim:(jdata.claimable_total>0)}
                
                try{//MMR
                    let mmrdata= await fetch("https://game-api.axie.technology/api/v2/"+from_acc.replace('0x','ronin:'), { method: "Get" }).then(res => res.json()).then((json) => { return json})
                    if(mmrdata.mmr)data.mmr=mmrdata.mmr
                }catch(e){
                    utils.log(e,message)
                }
                return data
            }else{
                let url = "https://game-api.axie.technology/api/v2/"+from_acc.replace('0x','ronin:')  ;
                data= await fetch(url, { method: "Get" }).then(res => res.json()).then((json) => { return json});
            }
            return data

        }catch(e){
            this.log("ERROR: "+e.message,message)
        }
    },
    claimData:async function(currentUser,message,panel=true){
        try{

            let from_acc=currentUser.accountAddress
            if(!this.isSafe(from_acc))return message.channel.send(`Una de las wallets esta mal!`);

            let data=await this.getSLP(currentUser.accountAddress,message,false)
            let ahora=new Date().getTime()
            let date_ahora=this.FROM_UNIX_EPOCH(ahora/1000)
            let date_last_claim=this.FROM_UNIX_EPOCH(data.last_claim)
            let date_next_claim=this.ADD_DAYS_TO_UNIX(data.last_claim,15)
            let diffInMilliSeconds=(ahora/1000)-data.last_claim
            let days = (Math.floor(diffInMilliSeconds / 3600) /24).toFixed(2)
            if(days==0)days=15

            let slp=data.in_game_slp?data.in_game_slp:data.ronin_slp
            let prom = Math.round(slp/days)
            

            let porcetage=prom<=TABULADORES.cuatro?20:prom<TABULADORES.tres?30:prom<TABULADORES.dos?40:prom<TABULADORES.uno?50:prom>=TABULADORES.uno?60:0;
            
            let arecibir=Math.round(slp/(100/porcetage))
            let embed = new MessageEmbed().setTitle('Calculo').setColor('GREEN').setTimestamp()
            
            embed.addFields(
                //{ name: 'Precio', value: ''+slp+'USD'},
                { name: 'ID', value: ''+currentUser.num,inline:true},
                { name: 'Wallet', value: ''+currentUser.scholarPayoutAddress},
                { name: 'Comprobantes', value: 'https://explorer.roninchain.com/address/'+currentUser.accountAddress},
                { name: 'Fecha actual', value: ''+date_ahora,inline:true},
                { name: 'Ultimo reclamo', value: ''+date_last_claim,inline:true},
                { name: 'Proximo reclamo', value: ''+date_next_claim,inline:true},
                { name: 'SLP Total', value: ''+(slp),inline:true},
                { name: 'Dias', value: ''+days,inline:true},
                { name: 'Tu promedio', value: ''+prom,inline:true},
                { name: 'Porcentaje', value: ''+porcetage+'%',inline:true},
                { name: 'A recibir', value: ''+arecibir,inline:true},
                { name: 'Vacio', value: 'Vacio',inline:true},
            )

			let bono=0
            //let slp_price= await fetch("https://api.coingecko.com/api/v3/simple/price?ids=smooth-love-potion&vs_currencies=usd", { method: "Get" }).then(res => res.json()).then((json) => { return (Object.values(json)[0].usd)});
            //let min=15/2/slp_price*(1+(bono/100))
            /*if(arecibir<min)bono=30
            min=15/2/slp_price*(1+(bono/100))
            if(arecibir<min)bono=40
            min=15/2/slp_price*(1+(bono/100))
            if(arecibir<min)bono=50
            */
            if(bono>0){
                embed.addFields(
                    { name: 'Gracias!', value: '😀',inline:true},
                    { name: 'Bono', value: bono+'%',inline:true},
                    { name: 'A recibir', value: ''+Math.round(data.in_game_slp/(100/bono)),inline:true}
                )
            }
            embed.addFields(
                { name: 'Información', value: 'Revisa que tu wallet sea correcta\nTu promedio de SLP se baso en el calculo de los dias y el total acumulado. Si estas de acuerdo escribe "si" para poder cobrar, de lo contrario, "no"'},
                { name: 'Ajuste', value: 'Debito a que a partir del 9/2/2022 se cambio la cantidad de SLP emitido ahora el tabulador es diferente. Pero para este cobro hubo 9 dias en donde se tiene que ajustar el promedio a la cantidad de SLP anterior. Por eso es que este mes no hay bono pero fuimos generosos en el ajuste de promedio para compensar ese 10%.'},
            )
            if(panel)message.channel.send({content: ` `,embeds: [embed]})


            porcetage+=bono
            currentUser.jugador_slp=Math.round(data.in_game_slp/(100/porcetage))
            if(data.in_game_slp==0 && data.ronin_slp>0)currentUser.jugador_slp=Math.round(data.ronin_slp/(100/porcetage))
            let hours=this.HOURS_NEXT_CLAIM(data.last_claim)
            currentUser.hours=hours
            currentUser.in_game_slp=data.in_game_slp
            currentUser.ronin_slp=data.ronin_slp
            currentUser.has_to_claim=data.has_to_claim
            return currentUser

        }catch(e){
            this.log(e,message)
        }
    },
    esJeissonPagos:function(message){
        return message.author.id==877625345996632095 && message.channel.name.includes('comandos') 
    },
    esIngresos:function(message){
        if(this.esFabri(message))return true
        return message.channel.id==909165024642203658//canal entrevistas
    },
    esFabri:function(message){
        return message.author.id==533994454391062529 && message.channel.name.includes('comandos-admin')
    },
    getDiscordDByID:async function(el_id,message){
        await message.guild.members.fetch()
        let ingreso=message.guild.members.cache.find(c => {return c.id ==el_id});
        if(ingreso)return ingreso.user
    },
    erase(args,erase){

        let completo=args.join(" ").replaceAll(erase,'').toLowerCase().trim()
        completo=completo.replaceAll('á','a')
        completo=completo.replaceAll('é','e')
        completo=completo.replaceAll('í','i')
        completo=completo.replaceAll('ó','o')
        completo=completo.replaceAll('ú','u')
        return completo

    },
    getUserIDByUsername:async function(args,message,erase){
    
        let completo=this.erase(args,erase)
        let username=completo.split('#')[0]
        let discriminator=completo.split('#')[1]


        await message.guild.members.fetch()
        let ingreso=message.guild.members.cache.find(c => {
        //console.log(c.user.username.toLowerCase().trim(),username,c.user.username.toLowerCase() == username)
        return (c.user.username.toLowerCase() == username && c.user.discriminator == discriminator) });
        return ingreso
    },
    esManager:function(message){
        if(message.author.bot)return true
        let r1=message.guild.roles.cache.find(r => r.name === "Manager")
        if(r1 && message.member.roles.cache.has(r1.id) && message.channel.name.includes('comandos'))return true
        return false
    },
    esJugador:function(message){
        let r1=message.guild.roles.cache.find(r => r.name === "Jugador")
        if(r1 && message.member.roles.cache.has(r1.id))return true
        return false
    },
    log:function (e,message=null){        
        console.log(e)
        let log=e
        if(e.message)log=e.message
        if(log && log.includes('ERROR:Transaction has been reverted by the EVM'))log='ERROR: Transaction has been reverted by the EVM'
        logger.debug(log)
        console.log(log)
        if(message)message.channel.send(log)
    },
    get_jwt:async function (wallet,msg,from_private){
        wallet=wallet.replace('ronin:','0x')
        const web3 = await new Web3(new Web3.providers.HttpProvider(RONIN_PROVIDER_FREE));
        let signed_msg = await web3.eth.accounts.sign(msg, from_private)
        let hex_msg = signed_msg['signature']
        msg=JSON.stringify(msg)
        let url = `https://graphql-gateway.axieinfinity.com/graphql`;
        let query = `
        {
            "operationName": "CreateAccessTokenWithSignature",
            "variables": {
                "input": {
                    "mainnet": "ronin",
                    "owner": "${wallet}",
                    "message": ${msg},
                    "signature": "${hex_msg}"
                }
            },
            "query":"mutation CreateAccessTokenWithSignature($input: SignatureInput!){createAccessTokenWithSignature(input: $input) {newAccount result accessToken __typename}}"
        }`
        let response=await fetch(url, { method: 'post',headers: { 'Content-Type': 'application/json', 'User-Agent': USER_AGENT},body: JSON.stringify(JSON.parse(query))}).then(response => response.json()).then(data => { return data});
        if(!response || !response.data || !response.data.createAccessTokenWithSignature)return null
        return response.data.createAccessTokenWithSignature.accessToken
    },
    create_random_msg:async function (){
        let url = `https://graphql-gateway.axieinfinity.com/graphql`;
        let query = `
        {
            "operationName": "CreateRandomMessage",
            "variables": {},
            "query": "mutation CreateRandomMessage{createRandomMessage}"
        }`

        let response=await fetch(url, { method: 'post',headers: { 'Content-Type': 'application/json'},body: JSON.stringify(JSON.parse(query))}).then(response => response.json()).then(data => { return data});
        //console.log(response)
        if(!response || !response.data || !response.data.createRandomMessage)return null
        return response.data.createRandomMessage
    },
    getAxieCount:async function (wallet){
        let ja=await this.getAxiesIds(wallet)
        return ja.count
    },
    getAxiesIds:async function (wallet){
        if(!wallet)return
        wallet=wallet.replace('ronin:','0x')
        let url = `https://graphql-gateway.axieinfinity.com/graphql`;
        let query = `
        {
            "operationName": "GetAxieBriefList",
            "variables": {
                    "owner":"${wallet}"
            },
            "query": "query GetAxieBriefList($auctionType: AuctionType, $criteria: AxieSearchCriteria, $from: Int, $sort: SortBy, $size: Int, $owner: String) {  axies(auctionType: $auctionType, criteria: $criteria, from: $from, sort: $sort, size: $size, owner: $owner) {    total    results {      ...AxieBrief      __typename    }    __typename  }}fragment AxieBrief on Axie {  id  name  stage  class  breedCount  image  title  battleInfo {    banned    __typename  }  auction {    currentPrice    currentPriceUSD    __typename  }  parts {    id    name    class    type    specialGenes    __typename  }  __typename}"
        }`

        let response=await fetch(url, { method: 'post',headers: { 'Content-Type': 'application/json'},body: JSON.stringify(JSON.parse(query))}).then(response => response.json()).then(data => { return data});
        if(!response || !response.data || !response.data.axies)return null
        let dev= {count:response.data.axies.total,axies:response.data.axies.results}
        return dev

    },
    getAliasWallet(alias){
        alias=alias.toLowerCase()
        if(alias=='buenos')return 'ronin:4e45277c66da9bbca7f643ddadd5b5297b5e9650'
        if(alias=='amaloa')return 'ronin:9a9dc8ab2474625cb58bca01beb72759e2c7efaa'
        if(alias=='pablo' )return 'ronin:f0c889583622f97c67e2fc4cf2a5ce214f7eee8c'
        if(alias=='jeisson')return 'ronin:9f1c0c36728b3341084adaad489a651394c9e40a'
        if(alias=='breed')return 'ronin:b1c0e5cb955ac17d9cb42fb4ee6b6ae01b5a9c82'
        if(alias=='pro')return 'ronin:bfc07b770a4bfab0e9ac114ae2ca8275c701c28e'
        if(alias=='VENTA')return 'ronin:29e29959cbb316923e57238467e14135d19c16f9'
        return false
    },
    isNumeric(str) {
        if (typeof str != "string") return false // we only process strings!  
        return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
               !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
    },
    isSafe:function(wallet){
        return wallet.replace('0x','ronin:') in secrets
    },
    getArrSum(array){
        let sum=0
        for(let i in array){
            sum+=array[i]
        }
        return sum
    },
    getPaymentName:function(dateStr, locale){
        var initial =dateStr.split(/\//);
        let final=[ initial[1], initial[0], initial[2] ].join('/'); 
        var date = new Date(final);

        Date.prototype.monthNames = [
            "January", "February", "March","April", "May", "June","July", "August", "September","October", "November", "December"
        ];
        Date.prototype.getMonthName = function() {
            return this.monthNames[this.getMonth()];
        };
        Date.prototype.getShortMonthName = function () {
            return this.getMonthName().substr(0, 3);
        };
        if(date.getDate()>=15 && date.getDate()<=16)return "Mid-"+date.getShortMonthName()
        else if(date.getDate()>=27 )return "End-"+date.getShortMonthName()
        else return dateStr        
    },
    getDayName:function(dateStr, locale){
        
        var initial =dateStr.split(/\//);
        let final=[ initial[1], initial[0], initial[2] ].join('/'); 
        var date = new Date(final);
        return initial[0]+'-'+date.toLocaleDateString(locale, { weekday: 'long' });        
    }
}