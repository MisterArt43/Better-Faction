import { Player } from "@minecraft/server";
import { Ply, db_player } from "../../Object/player/Ply";
import { Faction, db_faction, factionRank } from "../../Object/faction/Faction";
import { Server, log, sleep, tellraw } from "../../Object/tool/tools";
import { Chunk, db_chunk } from "../../Object/chunk/Chunk";
import { addSubCommand, cmd_permission } from "../CommandManager";
import { cmd_module } from "../../Object/database/db_map";
import { translate } from "../../Object/tool/lang";

addSubCommand(
	"quit",
	"Quit a faction.",
	`${globalThis.prefix}faction quit`,
	["quit", "q"],
	cmd_module.faction,
	cmd_permission.member,
	true,
	false,
	Factionquit,
	[["faction", "f"]]
)

async function Factionquit(args: string[], player: Player, ply: Ply) {
	const fac = db_faction.get(ply.faction_name ?? "");
	if (fac) {
		if (fac.playerList.find(p => p.name === ply.name && p.permission === factionRank.Leader)) {
			log(`§e${ply.name}§r has disbanded the faction §e${fac.name}§r.`);
			let i = 1;
			for (const [key, faction] of db_faction) {
				const allyIndex = faction.ally.findIndex(a => a === fac.name);
				if (allyIndex !== -1) {
					faction.remove_to_update_faction();
					faction.ally.splice(allyIndex, 1);
					faction.add_to_update_faction();
				}

				const enemyIndex = faction.enemy.findIndex(e => e === fac.name);
				if (enemyIndex !== -1) {
					faction.remove_to_update_faction();
					faction.enemy.splice(enemyIndex, 1);
					faction.add_to_update_faction();
				}

				if (i % 6 === 0) await sleep(1);
				i++;
			}

			for (const p of fac.playerList) {
				const pl = db_player.get(p.name);
				if (!pl) continue;
				pl.remove_to_update_player();
				pl.faction_name = null;
				pl.add_to_update_player();
			}

			fac.claim.forEach((c) => {
				let chunk = db_chunk.get(c.x + "," + c.y + Server.id); // y = z
				if (chunk !== undefined) Chunk.remove_chunk(chunk);
			});

			Faction.remove_faction(fac);
		} else {
			ply.remove_to_update_player();
			ply.faction_name = null;
			ply.add_to_update_player();
			fac.remove_to_update_faction();
			fac.playerList.splice(fac.playerList.findIndex(p => p.name === ply.name), 1);
			fac.add_to_update_faction();

			fac.playerList.forEach(p => {
				tellraw(p.name, translate(ply.lang, ply.name)?.faction_quit ?? "no translation");
			});
		}
		tellraw(player, translate(ply.lang, fac.name)?.faction_quit_get ?? "no translation");
	} else {
		tellraw(player, translate(ply.lang)?.error_find_faction ?? "no translation");
	}
}