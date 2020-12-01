var chalk = require("chalk");
const BottomBar = require("inquirer/lib/ui/bottom-bar");
var mysql = require("mysql");
var config = require("./config.json");
require("dotenv").config();
var sql;

const error = chalk.bold.red;
const warn = chalk.yellow;
const success = chalk.green;
const info = chalk.blue;
var servers = {};
module.exports = {
	start: function(client) {
		if(client.user.username.includes("dev")) return console.log("[counting] DEVBOT DETECTED");
		if(client.user.username.includes("Dev")) return console.log("DEVBOT DETECTED");
		if(!config.counting.enabled) return console.log(`[counting] ${error("Counting is disabled!")}`);
		if(!config.misc.mysql) return console.log(`[counting] ${error("MySQL is not enabled. MySQL is required for counting.")}`);
		
		let con = mysql.createConnection({
			host: process.env.SQL_HOST,
			user: process.env.SQL_USER,
			password: process.env.SQL_PASS,
			database: process.env.SQL_DB
		});

		con.connect(function(err) {
			if (err) {
				return console.log(`[counting] ${error("SQL connection failed. Maybe the credentials are invalid?")}`);
			} else {
				console.log(`[counting] ${info("Connected to the database")}`);

				sql = "CREATE TABLE counting (serverid VARCHAR(255), number VARCHAR(255), lastcounter VARCHAR(255), id INT AUTO_INCREMENT PRIMARY KEY)";
				con.query(sql, function (err, result) {
					if (err) {
						if(err.code == "ER_TABLE_EXISTS_ERROR") {
							console.log(`[counting] ${warn("Table already exists")}`);
						} else {
							console.log(`[counting] ${error("Table creation failed")} (probably already exists)`);
						}
					} else {
						console.log(`[counting] ${success("Table created")}`);
					}
				});

				client.guilds.cache.forEach(server => {
					let serverid = server.id.toString();
					let servername = server.name;
					sql = `SELECT * FROM counting WHERE serverid = ${server.id}`;
					con.query(sql, function (err, result) {
						if (err) {
							console.log(`[counting] ${error("Something went wrong in the counting startup!")}`);
							console.log(err);
						} else {
							if (result.length <= 0) {
								con.connect(function(err) {
									if (err) {
										console.log(`[counting] ${error("Failed to connect to the database")}`);
										console.log(err);
									} else {
										sql = `INSERT INTO counting(serverid, number) VALUES (${server.id}, 0)`;
										con.query(sql, function (err, result) {
											if (err) {
												console.log(`[counting] ${error("Failed to create row for server with id:")} ${server.id}`);
											}
										});
										servers[serverid].id = serverid;
										servers[serverid].number = 0;
										servers[serverid].lastcounter = 0;
								
									}
								});
							} else {
								servers[serverid.toString()] = {};
								servers[serverid.toString()].id = serverid;
								servers[serverid.toString()].number = result[0].number;
								servers[serverid.toString()].lastcounter = result[0].lastcounter;
								console.log(servers);
							}

						}
					});
				});
				
			}
			console.log(`[counting] ${success("Counting is enabled and SQL credentials are valid!")}`);
		});
	},
	countCheck(message, client) {


	}
};