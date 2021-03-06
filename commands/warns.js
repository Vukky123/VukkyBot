// Copyright (C) 2020-2021 vtheskeleton, Vukky

const config = require("../config.json");
require("dotenv").config();
var mysql = require("mysql");
const { errorEmbed, warnsUserEmbed } = require("../utilities/embeds.js");
const vukkytils = require("../utilities/vukkytils");

module.exports = {
	name: "warns",
	description: "View warnings created using VukkyBot",
	botPermissions: ["EMBED_LINKS", "MANAGE_MESSAGES"],
	requiredAPIs: ["mysql"],
	guildOnly: true,
	usage: "<@user | user id> (if not specified, shows self)",
	aliases: ["warnings"],
	cooldown: 0,
	execute(message, args) {
		let warnsId;    
		let mentionedUser;
		if (isNaN(args[0]) && message.mentions.users.first()) {
			mentionedUser = message.guild.member(message.mentions.users.first()).user;
			warnsId = mentionedUser.id;
			everythingIsFine();
		} else if (args[0]) {
			warnsId = args[0];
			mentionedUser = message.client.users.fetch(warnsId).then(function (res) {
				mentionedUser = res;
				everythingIsFine();
			});
		} else {
			mentionedUser = message.author;
			warnsId = mentionedUser.id;
			everythingIsFine();
		}

		function everythingIsFine() {
			if(warnsId != message.author.id && !message.member.hasPermission("MANAGE_MESSAGES")) return message.channel.send(vukkytils.getString("WARNING_CANT_SEE_OTHER"));
			var con = mysql.createConnection({
				host: process.env.SQL_HOST,
				user: process.env.SQL_USER,
				password: process.env.SQL_PASS,
				database: process.env.SQL_DB
			});
			
			con.connect(function(err) {
				if (err) console.log(err);
			});
			
			let sql = `SELECT * FROM warnings WHERE (uid = ${warnsId} AND serverid = ${message.guild.id})`;
			con.query(sql, function (err, result) {
				if (err)  {
					message.channel.send(errorEmbed(err));
					console.log(err);
					con.end();
				} else {
					if (result.length == 0) { con.end(); return message.channel.send(warnsUserEmbed(mentionedUser.username, vukkytils.getString("NO_WARNINGS"))); }
					let warnList = "";
					
					for (let i = 0; i < result.length; i++) {
						warnList = warnList.concat(`**${result[i].reason}** (ID: ${result[i].id})\n`);
					}
					message.channel.send(warnsUserEmbed(mentionedUser.username, warnList));
					con.end();
				}
			});
		}
	},
};
