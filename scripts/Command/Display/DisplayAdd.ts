import { Player } from "@minecraft/server";
import { Ply } from "../../Object/player/Ply";
import { BFActionFormData, BFModalFormData } from "../../Object/formQueue/formQueue";
import { concatenateArgs, tellraw } from "../../Object/tool/tools";
import { DB } from "../../Object/database/database";
import { Display } from "../../Object/display/Display";
import { translate } from "../../Object/tool/lang";

function DisplayAdd(args: string[], player: Player, ply: Ply) {
    const dropdown = ["actionbar", "title", "rule"];
	new BFModalFormData()
	.title("Add display setting")
	.dropdown("display type", dropdown)
	.slider("amount of line", 1, 30, 1, 10)
	.show(player).then(res1 => {
		if (res1.canceled || !res1.formValues) {
			return
		}
		const nbLine = res1!.formValues[1] as number;
		const type = dropdown[res1!.formValues[0] as number];
		if (type === "rule") {
			if (DB.db_display.db_display_rule) return tellraw(player, "§cYou can't add more than 1 rule display.");
			let form = new BFModalFormData()
				.title("Add Rule")
			for (let i = 0; i < nbLine; i++) {
				form.textField(`Line n°${i + 1}`, "");
			}
			form.show(player).then(res => {
				if (res.canceled || !res.formValues) {
					return;
				}
				let display = "";
				for (let i = 0; i < nbLine; i++) {
					if (i + 1 == nbLine) {
						display += res.formValues[i];
					}
					else {
						display += res.formValues[i] + "\\n";
					}
				}
				Adisplay(["display", "add", dropdown[res1.formValues![0] as number], display], player, ply);
			})
		}
		else {
			let form = new BFModalFormData()
				.title("Add Display")
				.textField("tag", "player", "");
			for (let i = 0; i < (res1.formValues[1] as number); i++) {
				form.textField(`Line n°${i + 1}`, "");
			}
			form.show(player).then(res => {
				if (res.canceled || !res.formValues) {
					return;
				}
				let display = "";
				for (let i = 0; i < (res1.formValues![1] as number); i++) {
					if (i + 1 == res1.formValues![1]) {
						display += res.formValues[i + 1];
					}
					else {
						display += res.formValues[i + 1] + "\\n";
					}
				}
				Adisplay(["display", "add", dropdown[res1.formValues![0] as number], res.formValues[0] as string, display], player, ply);
			})
		}
	})
}

function Adisplay(args: string[], player: Player, ply: Ply) {
    if (args[2] == "title" || args[2] == "actionbar") {
        if (args[3].replace(/"/g, "").match(/[a-zA-Z:§0-9]{1,}/g)) {
            const name = concatenateArgs(args, 4, (str: string) => str.replace(/["]/g, "") + " ");
            Display.add_display(new Display(args[3], name.replace(/"/g, "'").replace(/\\n/g, "☼").replace(/\\/g, "").replace(/☼/g, "\n") + "§r", args[2] as 'title' || 'actionbar'));
            tellraw(player, translate(ply.lang).add_display);
        }
        else {
            tellraw(player, translate(ply.lang).error_tag);
        }
    }
    else if (args[2] == "rule") {
        const name = concatenateArgs(args, 3, (str: string) => str.replace(/["]/g, "") + " ");
        Display.add_display(new Display("rule", name.replace(/"/g, "'").replace(/\\n/g, "☼").replace(/\\/g, "").replace(/☼/g, "\n") + "§r", args[2] as 'rule'));
        tellraw(player, translate(ply.lang).add_display);
    }
    else {
        tellraw(player, translate(ply.lang).error_arg_display);
    }
}