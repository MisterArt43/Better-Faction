import { Player } from "@minecraft/server";
import { Ply } from "../../Object/player/Ply";
import { BFActionFormData } from "../../Object/formQueue/formQueue";
import { logData } from "../../Object/tool/tools";
import { addSubCommand } from "../CommandManager";
import { cmd_module, cmd_permission } from "../../Object/database/db_map";

addSubCommand(
	"showlogs",
	"will show the logs history",
	`${globalThis.prefix}showlogs`,
	["showlogs", "logs", "sl", "log"],
	cmd_module.dev,
	cmd_permission.dev,
	true,
	true,
	showlogs,
	[["manage"]]
)

function showlogs(args: string[], player: Player, ply: Ply) {
	new BFActionFormData()
	.title("logs history")
	.body(logData.join("§r\n"))
	.button("Close")
	.show(player)
}