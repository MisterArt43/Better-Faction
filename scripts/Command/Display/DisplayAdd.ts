import { Player } from "@minecraft/server";
import { Ply } from "../../Object/player/Ply";
import { BFActionFormData, BFModalFormData } from "../../Object/formQueue/formQueue";
import { concatenateArgs, tellraw } from "../../Object/tool/tools";
import { DB } from "../../Object/database/database";
import { Display } from "../../Object/display/Display";
import { translate } from "../../Object/tool/lang";
import { addSubCommand } from "../CommandManager";
import { cmd_module, cmd_permission } from "../../Object/database/db_map";
import { ModalFormResponse } from "@minecraft/server-ui";

addSubCommand(
	"add",
	"Add a display",
	`${globalThis.prefix}display add`,
	["add", "a"],
	cmd_module.display,
	cmd_permission.admin,
	true,
	true,
	DisplayAdd,
	[["display", "d"]]
)

function DisplayAdd(args: string[], player: Player, ply: Ply) {
    const dropdownOptions  = ["actionbar", "title", "rule"];

	const showModalForm = (title: string, nbLine: number, dropdownIndex: number) => {
        let form = new BFModalFormData().title(title);
        if (dropdownOptions[dropdownIndex] === "rule") {
            for (let i = 0; i < nbLine; i++) {
                form.textField(`Line n°${i + 1}`, "");
            }
        } else {
            form.textField("tag", "player", "");
            for (let i = 0; i < nbLine; i++) {
                form.textField(`Line n°${i + 1}`, "");
            }
        }
        return form.show(player);
    };

	const handleFormResult = (res: ModalFormResponse, nbLine: number, dropdownIndex: number) => {
        if (res.canceled || !res.formValues) return;
        
        let displayText = "";
        const offset = dropdownOptions[dropdownIndex] === "rule" ? 0 : 1;
        
        for (let i = 0; i < nbLine; i++) {
            displayText += res.formValues[i + offset];
            if (i + 1 < nbLine) {
                displayText += "\\n";
            }
        }

        const tag = dropdownOptions[dropdownIndex] === "rule" ? "" : res.formValues[0] as string;
        Adisplay(["display", "add", dropdownOptions[dropdownIndex], tag, displayText], player, ply);
    };

	new BFModalFormData()
	.title("Add display setting")
	.dropdown("display type", dropdownOptions)
	.slider("amount of line", 1, 30, 1, 10)
	.show(player).then(res1 => {
		if (res1.canceled || !res1.formValues) return;

		const nbLine = res1.formValues[1] as number;
		const dropdownIndex = res1.formValues[0] as number;

		if (dropdownOptions[dropdownIndex] === "rule" && DB.db_display.db_display_rule) {
			return tellraw(player, "§cYou can't add more than 1 rule display.");
		}

		showModalForm(dropdownOptions[dropdownIndex] === "rule" ? "Add Rule" : "Add Display", nbLine, dropdownIndex)
			.then(res2 => handleFormResult(res2, nbLine, dropdownIndex));
	});
}

function Adisplay(args: string[], player: Player, ply: Ply) {
    if (args[2] == "title" || args[2] == "actionbar") {
        if (args[3].replace(/"/g, "").match(/[a-zA-Z:§0-9]{1,}/g)) {
            const name = concatenateArgs(args, 4, (str: string) => str.replace(/["]/g, "") + " ");
            Display.add_display(new Display(args[3], name.replace(/"/g, "'").replace(/\\n/g, "\n").replace(/\\/g, "") + "§r", args[2] as 'title' || 'actionbar'));
            tellraw(player, translate(ply.lang).add_display);
        }
        else {
            tellraw(player, translate(ply.lang).error_tag);
        }
    }
    else if (args[2] == "rule") {
        const name = concatenateArgs(args, 3, (str: string) => str.replace(/["]/g, "") + " ");
        Display.add_display(new Display("rule", name.replace(/"/g, "'").replace(/\\n/g, "\n").replace(/\\/g, "") + "§r", args[2] as 'rule'));
        tellraw(player, translate(ply.lang).add_display);
    }
    else {
        tellraw(player, translate(ply.lang).error_arg_display);
    }
}