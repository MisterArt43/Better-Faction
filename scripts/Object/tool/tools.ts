import { Dimension, Player, system, world } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";
import { DB } from "../database/database";
import { Ply } from "../player/Ply";


// -------------------------- //
//       WORLD TOOLS          //
// -------------------------- //

export const Server = world.getDimension("overworld");
export const Nether = world.getDimension("nether");
export const TheEnd = world.getDimension("the end");

export function tellraw(selector : string, text : string) {
	if (!selector.match(/@/g))
		Server.runCommandAsync(`tellraw "${selector}" {"rawtext":[{"text":"§r${text.replace(/"/g, "\'")}"}]}`);
	else
		Server.runCommandAsync(`tellraw ${selector} {"rawtext":[{"text":"§r${text.replace(/"/g, "\'")}"}]}`);
}
export function log(text : number | string) { Server.runCommandAsync(`tellraw @a[tag=log] {"rawtext":[{"text":"§7{log} §r${text.toString().replace(/"/g, "\'").replace(/\n/g, "§r\n")}"}]}`) }

export function sleep(ticks: number) { return new Promise<void>(resolve => system.runTimeout(resolve, ticks)); }


// -------------------------- //
//       DATABASE TOOLS       //
// -------------------------- //

/**
 * Convert Hexadecimal to string
 * @param Hexadecimal
 * @returns {String}
 */
export function hexToText(hex: string): string {
	return hex.split(" ").map((char) => {
		return String.fromCharCode(parseInt(char, 16));
	}).join("");
}

/**
 * Convert string to Hexadecimal
 * @param {string} text
 * @returns {string}
 */
export function textToHex(text: string): string {
	return text.split("").map((char) => {
		return char.charCodeAt(0).toString(16);
	}).join(" ");
}

/**
 * @param {RegExp} regexObj
 * @example getMap(/(?<=\$db_player\()[0-9a-f\s]+(?=\))/g);
 * @returns {String[]} string array
 */
export function getMap(regexObj: RegExp): string[] {
	try {
		let data = "";
		let score = world.scoreboard.getObjective('database')?.getScores();
		if (score === undefined)
			throw "score undefined";
		score.forEach(s => {
			data += s.participant.displayName;
		})
		try {
			if (data == "")
				throw "data empty";
			return data.match(regexObj) ?? [];
		} catch (e) {
			Server.runCommandAsync(`say getBinary error: ${e}`);
		}

	} catch (e) {
		Server.runCommandAsync(`say getBinary error: ${e}`);
	}
	throw "error";
}


// -------------------------- //
//    STRING MANIPULATION     //
// -------------------------- //

/**
 * return first occurence of tag start with tag
 */
export function findFirstTagStartWith(player: Player, tag: string, tags?: string[]): string | undefined {
	const regex = /"/g;
	let foundTag = player.getTags().find((aTag) => aTag.replace(regex, "").startsWith(tag));

	if (tags) foundTag = tags.find((aTag) => aTag.replace(regex, "").startsWith(tag));
	else foundTag = player.getTags().find((aTag) => aTag.replace(regex, "").startsWith(tag));
	return foundTag ? foundTag.replace(regex, "") : undefined;
}

/**
 * return all occurence of tag start with tag
 */
export function findTagsStartWithV2(player: Player, tag: string, tags?: string[]): string[] {
	if (tags) return tags.filter((aTag) => aTag.replace(/"/g, "").startsWith(tag));
	return player.getTags().filter((aTag) => aTag.replace(/"/g, "").startsWith(tag));
}

type concatFunc = (str: string) => string;

export function concatenateArgs(args: string[], start?: number, func?: concatFunc): string {
	const number = start ?? 0;
    let result = "";

    for (let i = number; i < args.length; i++) {
		func ? result += func(args[i]) + " " : result += args[i] + " ";
    }
    return result.trim();
}

export function concatFacName(args: string[], start: number) {
	return concatenateArgs(args, start, (s) => s.replace(/"/g, "").toLowerCase().replace(/\b\w/g, c => c.toUpperCase()));
}

export function getTypedKeys<T extends object>(obj: T): (keyof T)[] {
    return Object.keys(obj) as (keyof T)[];
}


// -------------------------- //
//       COMMAND TOOLS        //
// -------------------------- //

export async function runCommandDim(command: string, dimension: Dimension['id']) {
	try {
		return { error: false, ...await world.getDimension(dimension).runCommandAsync(command)};//to fix at the next update
	} catch (error) {
		return { error: true, successCount: 0 };
	}
}

export async function tpsound(player: Player) {
	await sleep(2);
	await player.runCommandAsync(`playsound mob.shulker.teleport`);
}