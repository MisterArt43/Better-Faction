import { Player, system } from "@minecraft/server";
import { Ply } from "../../Object/player/Ply";
import { Nether, Server, TheEnd, sleep } from "../../Object/tool/tools";
import { addSubCommand } from "../CommandManager";
import { cmd_module, cmd_permission } from "../../Object/database/db_map";

addSubCommand(
	"seechunk",
	"show particle around the chunk of your location",
	`${prefix}seechunk`,
	["sc", "seechunk", "showchunk", "seec", "showc"],
	cmd_module.claim,
	cmd_permission.member,
	true,
	false,
	seeChunk
);

function seeChunk(args: string[], player: Player, ply: Ply) {
	const dim = player.dimension.id === "minecraft:overworld" ? Server : player.dimension.id === "minecraft:nether" ? Nether : TheEnd;
	system.run(async () => {
		for (let j = 0; j < 6; j++) {
			for (let i = 0; i <= 15; i += 2.5) {
				dim.spawnParticle("minecraft:endrod", { x: ((player.location.x >> 4) * 16 + i), y: player.location.y + 1, z: ((player.location.z >> 4) * 16) });
				dim.spawnParticle("minecraft:endrod", { x: ((player.location.x >> 4) * 16 + i), y: player.location.y + 1, z: ((player.location.z >> 4) * 16 + 16) });
				dim.spawnParticle("minecraft:endrod", { x: ((player.location.x >> 4) * 16), y: player.location.y + 1, z: ((player.location.z >> 4) * 16 + i) });
				dim.spawnParticle("minecraft:endrod", { x: ((player.location.x >> 4) * 16 + 16), y: player.location.y + 1, z: ((player.location.z >> 4) * 16 + i) });
			}
			await sleep(35);
		}
	})
}