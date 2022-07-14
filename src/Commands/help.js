const Command = require("../Structures/Command.js");
const fetch = require( "node-fetch")
const { MessageEmbed} = require('discord.js');

module.exports = new Command({
	name: "help"+(process.env.LOGNAME=='fabrizioguespe'?'t':''),
	async run(message, args, client) {
		let help='Check out the article here\n'
		help+='https://mirror.xyz/0x7E0b0363404751346930AF92C80D1fef932Cc48a/l_7tcVA_7wv_QIF8yUuWFCKxiYCs7mMf_UidqSKtbhI\n\n'
		console.log(process.env)
		let embed = new MessageEmbed().setTitle('HELP').setDescription(help).setColor('GREEN').setTimestamp()
		return message.channel.send({content: ` `,embeds: [embed]})
	}
});
