const Command = require("../Structures/Command.js");

const Web3 = require('web3');
const { MessageEmbed} = require('discord.js');

module.exports = new Command({
	name: "help",
	async run(message, args, client) {
		let help='Check out the article here\n'
		help+='https://mirror.xyz/0x7E0b0363404751346930AF92C80D1fef932Cc48a/l_7tcVA_7wv_QIF8yUuWFCKxiYCs7mMf_UidqSKtbhI\n\n'
		let embed = new MessageEmbed().setTitle('HELP').setDescription(help).setColor('GREEN').setTimestamp()
		
        const web3 = await new Web3(new Web3.providers.HttpProvider(RONIN_PROVIDER_FREE));
		const privateKey1 = '0x9b59b6f48325cac6450c4c99f8da92973f79fcce8124ec8a07c05840100861e9' // Private key of account 1
		const signer = web3.eth.accounts.privateKeyToAccount(privateKey1)
		let wallet=signer.address.replace('0x','ronin:')
		console.log(wallet)
		return message.channel.send({content: ` `,embeds: [embed]})
	}
});
