import { Player } from "@minecraft/server";
import { Ply } from "../../Object/player/Ply";
import { Warp } from "../../Object/warp/Warp";
import { addSubCommand } from "../CommandManager";
import { cmd_module, cmd_permission } from "../../Object/database/db_map";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { find_warp_UI } from "../../Object/tool/find_waps_UI";
import { WarpNotEmpty } from "./_UtilsWarp";

addSubCommand(
	"access",
	"filter who can access the warp, by adding or removing tags to the allowed or denied list\n use case : \n - if the warp have one or more tags in the allowed list, only the player with one of these tags can access the warp\n - if the warp have one or more tags in the denied list, the player with one of these tags can't access the warp\n if a player have both a tag in the allowed and denied list, he can't access the warp\n - if the warp have no tags in the allowed and denied list, all players can access the warp",
	`${globalThis.prefix}warp edit access`,
	["access", "a"],
	cmd_module.warp,
	cmd_permission.admin,
	true,
	true,
	warpEditAccessUI,
	[["warp", "w"], ["edit", "e"]],
	WarpNotEmpty
)

async function warpEditAccessUI(args: string[], player: Player, ply: Ply) {
	let currentWarp = await find_warp_UI(player, true);
	if (!currentWarp) return player.sendMessage("This warp doesn't exist");
	new ActionFormData()
	.title("Edit Warp Access")
	.body("summery of what is Access : \nWith this UI you can filter who can access this warp by adding or removing tags to the allowed or denied list, see more in " + globalThis.prefix + "help")
	.button("§aAdd§f/§cRemove §aAllowed Tag")
	.button("§aAdd§f/§cRemove §aDenied Tag")
	.show(player).then(res => {
		if (res.canceled) return;
		if (res.selection === 0) {
			warpEditAddOrRemoveAccessTagUI(player, ply, currentWarp, "allow");
		}
		else {
			warpEditAddOrRemoveAccessTagUI(player, ply, currentWarp, "deny");
		}
	})
}

function warpEditAddOrRemoveAccessTagUI(player: Player, ply: Ply, warp: Warp, type: "allow" | "deny") {
	new ActionFormData()
	.title("Edit Warp Access")
	.button("§aAdd " + type + " tag")
	.button("§cRemove " + type + " tag")
	.button("§aBack")
	.show(player).then(res => {
		if (res.canceled) return;
		if (res.selection === 0) {
			warpEditAddAccessTag(player, ply, warp, type);
		}
		else if (res.selection === 1) {
			warpEditRemoveAccessTag(player, ply, warp, type);
		}
		else {
			warpEditAccessUI([], player, ply);
		}
	})
}

function warpEditAddAccessTag(player: Player, ply: Ply, warp: Warp, type: "allow" | "deny") {
	new ModalFormData()
	.title("Edit Warp Access")
	.textField("Tag", "tag")
	.show(player).then(res => {
		if (res.canceled) return;
		if (type === "allow") {
			warp.addAllowedTag(player, res.formValues![0] as string);
		}
		else {
			warp.addDeniedTag(player, res.formValues![0] as string);
		}
	})
}

function warpEditRemoveAccessTag(player: Player, ply: Ply, warp: Warp, type: "allow" | "deny") {
	const form = new ActionFormData()
	.title("Edit Warp Access")
	.body("Select a tag to remove")
	warp[type].forEach(tag => form.button(tag));
	form.show(player).then(res => {
		if (res.canceled) return;
		if (type === "allow") {
			warp.removeAllowedTag(player, warp.allow[res.selection!]);
		}
		else {
			warp.removeDeniedTag(player, warp.deny[res.selection!]);
		}
	})
}