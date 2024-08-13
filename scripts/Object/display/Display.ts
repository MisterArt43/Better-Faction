import { system, world } from "@minecraft/server";
import { Server, hexToText, log, sleep, textToHex } from "../tool/tools";
import { DB } from "../database/database";


function display_size(): number {
	return db_display.db_display_actionbar.size + db_display.db_display_title.size + (db_display.db_display_rule ? 1 : 0);
}

function display_delete(display: Display) {
	if (display.type === displayTypes.title)
		return db_display.db_display_title.delete(display.tag)
	if (display.type === displayTypes.actionbar)
		return db_display.db_display_actionbar.delete(display.tag)
	if (display.type === displayTypes.rule && db_display.db_display_rule) {
		db_display.db_display_rule = null;
		return true
	}
	return false
}

function display_values(): Display[] {
	const displayList: Display[] = [];
	Object.values(db_display).forEach((displayMap) => {
		if (displayMap instanceof Map) {
			displayList.concat(Array.from(displayMap.values()));
		}
		else if (displayMap instanceof Display) {
			displayList.push(displayMap);
		}
	});
	return displayList;
}

function display_getter_tag(tag: string): Display[] {
	const displayList: Display[] = [];
	Object.values(db_display).forEach((displayMap) => {
		if (displayMap instanceof Map) {
			const display = displayMap.get(tag);
			if (display) displayList.push(display);
		}
	});
	return displayList;
}

function display_getter_by_type_tag(tag: string, type: Display['type']): Display | undefined {
	if (type === displayTypes.title) {
		return DB.db_display.db_display_title.get(tag);
	} else if (type === displayTypes.actionbar) {
		return DB.db_display.db_display_actionbar.get(tag);
	} else if (type === displayTypes.rule) {
		return DB.db_display.db_display_rule ? DB.db_display.db_display_rule : undefined;
	}
	else return undefined;
}

function display_setter_tag(key: Display['tag'], display: Display) {
	if (display.type === displayTypes.title) {
		DB.db_display.db_display_title.set(key, display);
	} else if (display.type === displayTypes.actionbar) {
		DB.db_display.db_display_actionbar.set(key, display);
	} else if (display.type === displayTypes.rule) {
		DB.db_display.db_display_rule = display;
	}
}

function display_has_tag(key: Display['tag'], type: Display['type']) {
	if (type === displayTypes.title) {
		return DB.db_display.db_display_title.has(key);
	} else if (type === displayTypes.actionbar) {
		return DB.db_display.db_display_actionbar.has(key);
	} else if (type === displayTypes.rule) {
		return !!DB.db_display.db_display_rule;
	}
	else return false;
}

export const displayTypes = {
	"title": "title",
	"actionbar": "actionbar",
	"rule": "rule"
} as const;

export class Display {
	public tag: string;
	public text: string;
	public type: (typeof displayTypes[keyof typeof displayTypes]);
	[key: string]: any;

	constructor(tag: string, text: string, type: (typeof displayTypes[keyof typeof displayTypes])) {
		this.tag = tag;
		this.text = text;
		this.type = type;
	}

	static async initDB_display() {
		if (db_display.db_display_actionbar.size + db_display.db_display_title.size + (db_display.db_display_rule ? 1 : 0) !== 0) return;
		const objectiveName = "db_display";
		await Server.runCommandAsync(`scoreboard objectives add ${objectiveName} dummy`);
		const start = Date.now();

		try {
			const objective = world.scoreboard.getObjective(objectiveName) ?? world.scoreboard.addObjective("db_display", "");
			const sc = objective.getScores();
			const nbParticipants = sc.length;
			const batchSize = 100 >>> 0;
			const batchNumber = Math.ceil(nbParticipants / batchSize);

			const progressBar = "§a[DB] §7loading db_display... §e";
			const percentageUnit = 100 / nbParticipants;
			loadDatabase.display = progressBar + "0.00%";

			for (let i = 0; i < batchNumber; i++) {
				const batchStart = i * batchSize;
				const batchEnd = batchStart + batchSize;
				const batch = batchEnd < nbParticipants ? sc.slice(batchStart, batchEnd) : sc.slice(batchStart);

				const updateDbPlayerPromises = batch.map(async (score) => {
					const db = score.participant.displayName.match(/(?<=\$db_display\()[0-9a-f\s]+(?=\))/g);
					if (!db) {
						log("§cError: Mismatch data in db_display, try deleting the database and restarting the server. Contact the developer.");
						return;
					}
					let display = JSON.parse(hexToText(db.join(""))) as Display;
					if (display.tag === undefined)
						display.tag = "";

					// Update db_display map
					const existingObject = DB.db_display.get(display.tag).find((d) => d.type === display.type && d.tag === display.tag);

					if (existingObject) {
						// Update existing display data
						log(`§cDuplicate display found, fixing ${display.tag}`)
						objective.removeParticipant(score.participant);
					} else {
						DB.db_display.set(`${display.tag}`, display);
					}
				});
				// Update progress bar
				loadDatabase.display = progressBar + (batchEnd * percentageUnit).toFixed(2) + "%";
				await Promise.all(updateDbPlayerPromises);
			}
			loadDatabase.display = progressBar + "100%";
		} catch (e) {
			log("§7[DB] can't find any database for db_display, creating a new one " + e);
		}

		const end = Date.now();
		log("§7db_display loaded in " + ((end - start) / 1000) + " second(s)");
	}

	static async UpdateDB() {
		if (db_display.size() > 0 && isLoaded === false) {
			let counter = 1;
			for (let obj of db_display.values()) {
				obj.remove_to_update_display();
				let new_obj = new Display("update", "update", "title");
				let old_key = Object.keys(obj);
				let new_key = Object.keys(new_obj);
				let old_value = Object.values(obj);

				for (let i = 0; i < new_key.length; i++) {
					for (let j = 0; j < old_key.length; j++) {
						if (new_key[i] === old_key[j]) {
							new_obj[new_key[i]] = old_value[j];
							break;
						}
					}
				}
				//log("\n§cOld => §7" + JSON.stringify(obj) + "\n§aNew => §7" + JSON.stringify(new_obj));
				new_obj.add_to_update_faction();
				obj = new_obj;
				if (counter++ % 37 === 0) await sleep(1);
			};
			log("§8[Display] §7Database Updated");
		}
		else {
			log("cannot update database")
		}
	}

	static add_display(display: Display | undefined) {
		if (display === undefined) return;
		if (db_display.has(display.tag, display.type)) {
			log(`§cDuplicate display found, fixing ${display.tag}`);
			Display.remove_display(db_display.getByType(display.tag, display.type));
		}
		db_display.set(display.tag, display);
		const scoreboard = world.scoreboard.getObjective("db_display")!;
		system.run(() => {
			scoreboard.addScore(`$db_display(${textToHex(JSON.stringify(display))})`, 1);
		});
		// Server.runCommandAsync("scoreboard players set \"$db_display(" + textToHex(JSON.stringify(display)) + ")\" db_display 1");
	}

	static remove_display(display: Display | undefined) {
		if (display === undefined) return;
		const scoreboard = world.scoreboard.getObjective("db_display")!;
		system.run(() => {
			scoreboard.removeParticipant(`$db_display(${textToHex(JSON.stringify(display))})`);
		});
		// Server.runCommandAsync("scoreboard players reset \"$db_display(" + textToHex(JSON.stringify(display)) + ")\" db_display");
		db_display.delete(display);
	}

	remove_to_update_display() {
		if (this === undefined) return;
		const scoreboard = world.scoreboard.getObjective("db_display")!;
		scoreboard.removeParticipant(`$db_display(${textToHex(JSON.stringify(this))})`);
		// Server.runCommandAsync("scoreboard players reset \"$db_display(" + textToHex(JSON.stringify(this)) + ")\" db_display");
	}

	add_to_update_display() {
		if (this === undefined) return;
		const scoreboard = world.scoreboard.getObjective("db_display")!;
		scoreboard.addScore(`$db_display(${textToHex(JSON.stringify(this))})`, 1);
		// Server.runCommandAsync("scoreboard players set \"$db_display(" + textToHex(JSON.stringify(this)) + ")\" db_display 1");
	}
}

export const db_display = {
	db_display_title: new Map<Display['tag'], Display>(),
	db_display_actionbar: new Map<Display['tag'], Display>(),
	db_display_rule: null as Display | null,
	get: display_getter_tag,
	getByType: display_getter_by_type_tag,
	set: display_setter_tag,
	has: display_has_tag,
	size: display_size,
	delete: display_delete,
	values: display_values
};