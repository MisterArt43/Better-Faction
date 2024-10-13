import { Player } from "@minecraft/server";
import { Ply } from "../../Object/player/Ply";
import { DB } from "../../Object/database/database";
import { tellraw } from "../../Object/tool/tools";
import { BFActionFormData } from "../../Object/formQueue/formQueue";
import { formatCreationFullDate } from "../../Object/tool/dateTools";
import { addSubCommand } from "../CommandManager";
import { cmd_module, cmd_permission } from "../../Object/database/db_map";
import { haveChunk } from "./_UtilsAdmin";

addSubCommand(
	"info",
	"Get info about the claim on your position",
	`${globalThis.prefix}admin claim info`,
	["info", "i"],
	cmd_module.claim,
	cmd_permission.moderator,
	true,
	true,
	infoClaim,
	[["admin", "adm"], ["claim", "c"]],
	haveChunk
)

function infoClaim(args: string[], player: Player, ply: Ply) {
	const chunk = DB.db_chunk.get((player.location.x >> 4) + "," + (player.location.z >> 4) + player.dimension.id);

	const fac = DB.db_faction.get(chunk?.faction_name ?? "");
	if (!chunk) {
		tellraw(player, "§cThere no claim on your position");
		return;
	}

	let message = "Claim info\n" +
		"\nFaction : " + chunk.faction_name +
		"\nCreated by : " + chunk.owner +
		"\nCreated at : " + formatCreationFullDate(chunk.date, DB.db_map.UTC);

	if (fac !== undefined) {
		message += "\nFaction info : " + fac.name +
		"\nfac power : " + fac.power +
		"\nfac claim : " + fac.claim.size +
		"\nfac claim in the same group : " + fac.groupClaim.get(chunk.group)?.size +
		"\nfac members : " + fac.playerList.length
	}

	new BFActionFormData()
	.title("Claim info")
	.body(message)
	.button("close")
	.show(player);
}