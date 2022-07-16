
const path = require('path');
var secrets = require(path.resolve(__dirname, "./Data/secrets"));
const fetch = require( "node-fetch")
var token_abi = require(path.resolve(__dirname, "./ABI/token_abi.json"));
var balance_abi = require(path.resolve(__dirname, "./ABI/balance_abi.json"));
const Web3 = require('web3');
var axie_abi = require(path.resolve(__dirname, "./ABI/axie_abi.json"));
const {MessageEmbed} = require('discord.js');

TABULADORES={uno:60,dos:45,tres:35,cuatro:25}


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
            let contract = new web3.eth.Contract(token_abi,web3.utils.toChecksumAddress(SLP_CONTRACT))
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
    cobroRoni:async function(data,message){

        try{
            if(data.in_game_slp>0)await this.claim(data,message)
            let slp_total=data.in_game_slp+data.ronin_slp
            let roni_wallet=await this.getWalletByAlias("BREED")
            roni_wallet=roni_wallet.replace('ronin:','0x')
            let fallo=false
            try{
                let tx=await this.transfer('slp',data.accountAddress,(roni_wallet),(slp_total),message)
                if(tx)logger.debug({tx:tx,type:'slp_ronimate',timestamp:this.timestamp_log(),date:this.date_log(),num:data.num, slp:(slp_total),num:data.num,from_acc:data.accountAddress,wallet:(roni_wallet)})
                
            }catch(e){
                fallo=true
                this.log(e,message)
            }
            return fallo
             
        }catch(e){
            this.log(e,message)
        }
    },
    cobro:async function(data,message){

        try{
            if(data.in_game_slp>0)await this.claim(data,message)
            let slp_total=data.in_game_slp+data.ronin_slp
            let roni_slp=slp_total-data.jugador_slp
            let jugador_slp=data.jugador_slp
            if(roni_slp==jugador_slp)roni_slp-=1
            let roniPrimero=(roni_slp>=jugador_slp)
            if(!data.scholarPayoutAddress)return message.channel.send("Wallet de cobro no existente")
            let player_wallet=data.scholarPayoutAddress.replace('ronin:','0x')
            let roni_wallet=await this.getWalletByAlias("BREED")
            roni_wallet=roni_wallet.replace('ronin:','0x')
            let fallo=false
            try{
                let tx=await this.transfer('slp',data.accountAddress,(roniPrimero?roni_wallet:player_wallet),(roniPrimero?roni_slp:jugador_slp),message)
                if(tx)logger.debug({tx:tx,type:'slp_'+(roniPrimero?'ronimate':'jugador'),timestamp:this.timestamp_log(),date:this.date_log(),num:data.num, slp:(roniPrimero?roni_slp:jugador_slp),num:data.num,from_acc:data.accountAddress,wallet:(roniPrimero?roni_wallet:player_wallet)})
                
            }catch(e){
                fallo=true
                this.log(e,message)
            }
            roniPrimero=!roniPrimero
            try{
                let tx=await this.transfer('slp',data.accountAddress,(roniPrimero?roni_wallet:player_wallet),(roniPrimero?roni_slp:jugador_slp),message)
                
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
    },
    date_log:function(){
        return new Date().getDate()+'/'+(new Date().getMonth()+1)+'/'+new Date().getFullYear()
    },
    transferAxie:async function(from_acc,to_acc,axie_id,message){
        if(!this.isSafe(from_acc) || !this.isSafe(to_acc))return message.channel.send(`Incorrect alias/wallet!`);
        let from_private = secrets[from_acc]
        from_acc=await this.getWalletByAlias(from_acc)
        to_acc=await this.getWalletByAlias(to_acc)
        console.log(from_acc,to_acc)

        if(!from_acc)return message.channel.send("Incorrect alias.")
        if(!to_acc)return message.channel.send("Incorrect alias.")

        try{            
            const web3 = await new Web3(new Web3.providers.HttpProvider(RONIN_PROVIDER_FREE));
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
            console.log(from_private)
                 
            message.channel.send("Success para transferir el Axie: "+axie_id+"\nAguarde un momento...");
            let signed  = await web3.eth.accounts.signTransaction(trans, from_private)
            let tr_raw=await web3.eth.sendSignedTransaction(signed.rawTransaction)
            
            if(tr_raw.status){            
                let embed = new MessageEmbed().setTitle('Exito!').setDescription("La transacción se procesó exitosamente. [Ir al link]("+"https://explorer.roninchain.com/tx/"+tr_raw.transactionHash+")").setColor('GREEN').setTimestamp()
				logger.debug({tx:tr_raw.transactionHash,type:'axie_transfer',timestamp:this.timestamp_log(),date:this.date_log(), axie_id:axie_id,from_acc:from_acc,to_acc:to_acc})
                return message.channel.send({content: ` `,embeds: [embed]})
            }        
            else message.channel.send("ERROR Status False");
        }catch(e){
            this.log(e,message)
        }
    },
    transfer:async function(token,from_acc,to_acc,balance,message){
        let contract_add=''
        if(token == 'slp') contract_add = SLP_CONTRACT
        else if(token == 'axs') contract_add = AXS_CONTRACT
        else if(token == "axies")contract_add = AXIE_CONTRACT
        else if(token == "weth")contract_add = WETH_CONTRACT


        if(!this.isSafe(from_acc) || !this.isSafe(to_acc))return message.channel.send(`Incorrect alias/wallet!`);
        from_acc=await this.getWalletByAlias(from_acc)
        if(!from_acc)return message.channel.send("Incorrect alias.")
        to_acc=await this.getWalletByAlias(to_acc)
        if(!to_acc)return message.channel.send("Incorrect alias.")


        try{
            const web3 = await new Web3(new Web3.providers.HttpProvider(RONIN_PROVIDER_FREE));
            let nonce = await web3.eth.getTransactionCount(from_acc, function(error, txCount) { return txCount}); 
            //nonce+=nonceplus
            let contract = new web3.eth.Contract(token_abi,web3.utils.toChecksumAddress(contract_add))
            let myData=contract.methods.transfer((web3.utils.toChecksumAddress(to_acc)),balance).encodeABI()
            
            let trans={
                "chainId": 2020,
                "gas": 492874,
                "from": from_acc,
                "gasPrice":await web3.utils.toWei("1", "gwei"),
                "value": 0,
                "to": contract_add,
                "nonce": nonce,
                data:myData
            }
    
            let breed=await this.getWalletByAlias("BREED")
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
    balance:async function(token,from_acc){

        let contract_add=''
        if(token == 'slp') contract_add = SLP_CONTRACT
        else if(token == 'axs') contract_add = AXS_CONTRACT
        else if(token == "axies")contract_add = AXIE_CONTRACT
        else if(token == "weth")contract_add = WETH_CONTRACT
        
        const web3 = await new Web3(new Web3.providers.HttpProvider(RONIN_PROVIDER));
        let contract = new web3.eth.Contract(balance_abi,web3.utils.toChecksumAddress(contract_add))
        from_acc=await this.getWalletByAlias(from_acc)
        let balance = await  contract.methods.balanceOf( web3.utils.toChecksumAddress(from_acc.replace("ronin:", "0x"))).call()
        return balance
    },
    async getWalletByAlias(alias){
		let from_private = secrets[alias]   
        const web3 = await new Web3(new Web3.providers.HttpProvider(RONIN_PROVIDER_FREE));
		if(from_private){
            const signer = web3.eth.accounts.privateKeyToAccount(from_private)
		    let wallet=signer.address//.replace('0x','ronin:')
            return wallet
        }
        return false

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
            let url = "https://game-api.axie.technology/api/v2/"+from_acc.replace('0x','ronin:')  ;
            data= await fetch(url, { method: "Get" }).then(res => res.json()).then((json) => { return json});
            return data

        }catch(e){
            this.log("ERROR: "+e.message,message)
        }
    },
    claimData:async function(alias,message,panel=true){
        try{
            if(!this.isSafe(alias))return message.channel.send(`Incorrect alias/wallet!`);
            const accountAddress=await utils.getWalletByAlias(alias)
            let data=await this.getSLP(accountAddress,message,false)
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
            let embed = new MessageEmbed().setTitle('Calc').setColor('GREEN').setTimestamp()
            
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
    isSafe:function(wallet){
        return wallet in secrets
    },
}