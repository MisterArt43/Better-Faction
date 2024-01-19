import { ChatSendBeforeEvent, Player, world } from "@minecraft/server";
import { DB } from "../Object/database/database";
import { findFirstTagStartWith, findTagsStartWithV2, tellraw } from "../Object/tool/tools";
import { Faction } from "../Object/faction/Faction";
import { Ply } from "../Object/player/Ply";

export function customChat(data: ChatSendBeforeEvent) {
    const name = data.sender.name;
    const player = DB.db_player.get(name);

    if (player === undefined) return;

    if (data.message.length > 200)
        return tellraw(data.sender, "§cYour message exceeds 200 characters");
	if (player.lastMessage === data.message.trim())
		return tellraw(data.sender, "§cYou can't send the same message twice");
	if (player.isMute)
		return tellraw(data.sender, "§cYou are muted");

	player.remove_to_update_player();
	player.lastMessage = data.message.trim();
	player.add_to_update_player();

    processMessage(data, player);
}

function processMessage(data: ChatSendBeforeEvent, player: Ply) {
    const faction = DB.db_faction.get(player?.faction_name ?? "");
    let message = buildMessage(data, player, faction);
    
	handleChatChannels(data, faction, player, message);
	logChatMessage(message);
}

function buildMessage(data: ChatSendBeforeEvent, player: Ply, faction: Faction | undefined) {
    const rankSeparator = (text: string) => { return "§7[" + text + "§7]§r"; };
    const tags = data.sender.getTags();
    const ranks = findTagsStartWithV2(data.sender, "role:", tags).map(tag => rankSeparator(tag.replace("role:", ""))).join("");
    const colorN = findFirstTagStartWith(data.sender, "colorName:", tags)?.replace("colorName:", "") ?? "§r";
    const colorM = findFirstTagStartWith(data.sender, "colorMessage:", tags)?.replace("colorMessage:", "") ?? "§r";

    let message = "";

    if (faction !== undefined && player.chat !== "faction") {
        message += faction.color + faction.separator[0] + faction.name + faction.separator[1] + "§r ";
    }

    message += ranks + colorN + player.name + " " + DB.db_map.chatPrefix + "§r " + colorM + data.message.replace(/§[1-9a-z]/g, "").replace(/\\/g, "\\\\");
    
    return message;
}

function handleChatChannels(data: ChatSendBeforeEvent, faction: Faction | undefined, player: Ply, message: string) {
	const onlinePlayers = Array.from(DB.db_player_online.values());
	
	if (player.chat === "faction" && faction !== undefined) {
		message = "§g[Faction] " + message;
		broadcastFactionMessage(message, faction, onlinePlayers );
	}
	else if (player.chat === "ally" && faction !== undefined) {
		message = "§a[Ally] " + message;
		broadcastAllyMessage(message, faction, onlinePlayers);
	}
	else {
		if (player.chat !== "all")
			message = `§7(${player.chat}§7) ` + message;
		broadcastMessage(player, message, player.chat, faction, onlinePlayers);
	}
}

function broadcastFactionMessage(message: string, faction: Faction, players: Ply[]) {
	players.forEach(p => {
		if (p.chat === "faction" && p.faction_name === faction.name)
			tellraw(p.name, message);
	})
}

function broadcastAllyMessage(message: string, faction: Faction, players: Ply[]) {
	let ally: Faction[] = []
	faction.ally.forEach(a => {
		let f = DB.db_faction.get(a)
		if (f !== undefined)
			ally.push(f);
	})

	players.forEach(p => {
		if (p.faction_name === faction.name || ally.find(a => a.name === p.faction_name) !== undefined)
			tellraw(p.name, message);
	})
}

function broadcastMessage(sender: Ply, message: string, channel: string, faction: Faction | undefined, players: Ply[]) {
    players.forEach(p => {
		if (p.chat === channel || sender.chat === "all")
			tellraw(p.name, message);
	})
}

function logChatMessage(message: string) {
    tellraw("@a[tag=chat_log]", "§8{Chat}:" + message);
}
