import { world } from "@minecraft/server";
import { Server, hexToText, log, sleep, textToHex } from "../tool/tools";

export let db_admin: Map<Admin['name'], Admin> = new Map<Admin['name'], Admin>();

export class Admin {
	public name: string;
	public rank: number;
	public passphrase: string;

	constructor(name: string, rank: number, passphrase: string) {
		this.name = name;
		this.rank = rank;
		this.passphrase = passphrase;
		return this;
	}

	static add_admin(admin: Admin) {
		if (!db_admin.has(admin.name)) {
			db_admin.set(admin.name, admin);
			Server.runCommandAsync("scoreboard players set \"$db_admin(" + textToHex(JSON.stringify(admin)) + ")\" db_admin 1");
		}
		else {
			log("§cadd admin error, the admin already exist");
		}
	}

	static remove_admin(admin: Admin) {
		if (db_admin.has(admin.name)) {
			Server.runCommandAsync("scoreboard players reset \"$db_admin(" + textToHex(JSON.stringify(admin)) + ")\" db_admin");
			db_admin.delete(admin.name);
		}
		else {
			log("§ccannot remove " + admin.name + "possible duplication in the database");
		}
	}

	static initDB_admin() {
		if (db_admin.size == 0) {
			Server.runCommandAsync("scoreboard objectives add db_admin dummy")
			try {
				world.scoreboard?.getObjective('db_admin') ?? world.scoreboard.addObjective("db_admin", "")
				.getScores().forEach(async s => {
					if (s.participant.displayName.match(/(?<=\$db_admin\()[0-9a-f\s]+(?=\))/g) != null) {
						const db = s.participant.displayName.match(/(?<=\$db_admin\()[0-9a-f\s]+(?=\))/g);
						if (!db) {
							log("§cError: Mismatch data in db_admin, try deleting the database and restarting the server. Contact the developer.");
							return;
						}
						let admin = JSON.parse(hexToText(db.join(""))) as Admin;
						db_admin.set(admin.name, admin)
						// log(db_admin.length.toString())
						await sleep(1)
					}
				})
				log("db_admin loaded")
			}
			catch (e) {
				log("§7[DB] can't find any databse for db_admin, creating a new one " + e);
			}
		}
	}
}