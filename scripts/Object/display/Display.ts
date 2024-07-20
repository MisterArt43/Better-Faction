import { world } from "@minecraft/server";
import { Server, hexToText, log } from "../tool/tools";
import { DB } from "../database/database";


function display_size(): number {
	return db_display.db_display_actionbar.size + db_display.db_display_title.size + (db_display.db_display_rule ? 1 : 0);
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

function display_setter_tag(key: Display['tag'], display: Display) {
	if (display.type === displayTypes.title) {
		DB.db_display.db_display_title.set(key, display);
	} else if (display.type === displayTypes.actionbar) {
		DB.db_display.db_display_actionbar.set(key, display);
	} else if (display.type === displayTypes.rule) {
		DB.db_display.db_display_rule = display;
	}
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
}

export const db_display = {
    db_display_title: new Map<Display['tag'], Display>(),
    db_display_actionbar: new Map<Display['tag'], Display>(),
    db_display_rule: null as Display | null,
    get: display_getter_tag,
    set: display_setter_tag,
    size: display_size,
	values: display_values
};