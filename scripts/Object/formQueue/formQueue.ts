import { ActionFormData, ActionFormResponse, FormCancelationReason, MessageFormData, ModalFormData } from "@minecraft/server-ui";
import { DB } from "../database/database";
import { Player } from "@minecraft/server";
import { log } from "../tool/tools";

export let displayFromMap: Map<string, Array<(player: Player) => Promise<ActionFormResponse>>> = new Map<string, Array<(player: Player) => Promise<ActionFormResponse>>>();

export async function processQueue(player: Player) {
    const playerName = player.name;
    const queue = displayFromMap.get(playerName);
    if (!queue || queue.length === 0) {
        return;
    }

    const formFunc = queue.shift();
    if (!formFunc) {
        return;
    }

    if (!DB.db_player_online.has(playerName)) {
        log(`§7[formQueue] §cPlayer ${playerName} is not online`);
        displayFromMap.delete(playerName); // Remove player from the map if they are no longer online
        return;
    }

    try {
        const res = await formFunc(player);
        if (res.canceled && res.cancelationReason === FormCancelationReason.UserBusy) {
            log(`§7[formQueue] §cPlayer ${playerName} is busy. Requeuing form...`);
            queue.unshift(formFunc); // Requeue the form for the next routine execution
        }
    } catch (error) {
        log(`§7[formQueue] §cError showing form for player ${playerName}: ${error}`);
    }
}

export function addToQueue(playerName: string, formFunc: (player: Player) => Promise<ActionFormResponse>) {
    if (!DB.db_player_online.has(playerName)) {
        log("§7[formQueue] §cThis player is not online");
        return;
    }

    if (displayFromMap.has(playerName)) {
        displayFromMap.get(playerName)?.push(formFunc);
    } else {
        displayFromMap.set(playerName, [formFunc]);
    }
}

export function addToQueueFront(playerName: string, formFunc: (player: Player) => Promise<ActionFormResponse>) {
    if (!DB.db_player_online.has(playerName)) {
        log("§7[formQueue] §cThis player is not online");
        return;
    }

    if (displayFromMap.has(playerName)) {
        displayFromMap.get(playerName)?.unshift(formFunc);
    } else {
        displayFromMap.set(playerName, [formFunc]);
    }
}

// Middleware to wrap the original show method
function showMiddleware(originalShow: (player: Player) => Promise<ActionFormResponse>): (player: Player) => Promise<ActionFormResponse> {
    return function (player: Player): Promise<ActionFormResponse> {
        return new Promise((resolve) => {
            const formFunc = async (player: Player) => {
                return await originalShow(player);
            };

            addToQueue(player.name, formFunc);

            // Process the queue immediately
            processQueue(player);
        });
    };
}

// Extend the original classes with the middleware
export class BFActionFormData extends ActionFormData {
    show = showMiddleware(super.show);
}

export class BFModalFormData extends ModalFormData {
    show = showMiddleware(super.show);
}

export class BFMessageFormData extends MessageFormData {
    show = showMiddleware(super.show);
}
