import { ActionFormData, ActionFormResponse, FormCancelationReason, MessageFormData, MessageFormResponse, ModalFormData, ModalFormResponse } from "@minecraft/server-ui";
import { DB } from "../database/database";
import { Player } from "@minecraft/server";
import { log } from "../tool/tools";

type FormResponse = ActionFormResponse | ModalFormResponse | MessageFormResponse;

export let displayFromMap: 
Map<string, Array<{ 
    formFunc: (player: Player) => Promise<FormResponse>, 
    resolve: (value: FormResponse | PromiseLike<FormResponse>) => void, 
    reject: (reason?: any) => void }>> 
    = new Map<string, Array<{ 
        formFunc: (player: Player) => Promise<FormResponse>, 
        resolve: (value: FormResponse | PromiseLike<FormResponse>) => void, 
        reject: (reason?: any) => void }>>();

export async function processQueue(player: Player) {
    const playerName = player.name;
    const queue = displayFromMap.get(playerName);
    if (!queue || queue.length === 0) {
        return;
    }

    const { formFunc, resolve, reject } = queue.shift()!;
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
        if ('canceled' in res && res.canceled && res.cancelationReason === FormCancelationReason.UserBusy) {
            log(`§7[formQueue] §cPlayer ${playerName} is busy. Requeuing form...`);
            queue.unshift({ formFunc, resolve, reject }); // Requeue the form for the next routine execution
        } else {
            resolve(res); // Resolve the promise with the form response
        }
    } catch (error) {
        log(`§7[formQueue] §cError showing form for player ${playerName}: ${error}`);
        reject(error); // Reject the promise in case of an error
    }
}

export function addToQueue(playerName: string, formFunc: (player: Player) => Promise<FormResponse>) {
    if (!DB.db_player_online.has(playerName)) {
        log("§7[formQueue] §cThis player is not online");
        return Promise.reject("Player is not online");
    }

    return new Promise<FormResponse>((resolve, reject) => {
        const queueItem = { formFunc, resolve, reject };
        if (displayFromMap.has(playerName)) {
            displayFromMap.get(playerName)?.push(queueItem);
        } else {
            displayFromMap.set(playerName, [queueItem]);
        }
    });
}

export function addToQueueFront(playerName: string, formFunc: (player: Player) => Promise<FormResponse>) {
    if (!DB.db_player_online.has(playerName)) {
        log("§7[formQueue] §cThis player is not online");
        return;
    }

    return new Promise<FormResponse>((resolve, reject) => {
        const queueItem = { formFunc, resolve, reject };
        if (displayFromMap.has(playerName)) {
            displayFromMap.get(playerName)?.unshift(queueItem);
        } else {
            displayFromMap.set(playerName, [queueItem]);
        }
    });
}

// Middleware to wrap the original show method
function showMiddleware<T extends FormResponse>(originalShow: (player: Player) => Promise<T>): (player: Player) => Promise<T> {
    return function (this: any, player: Player): Promise<T> {
        const formFunc = (player: Player) => originalShow.call(this, player);
        return addToQueue(player.name, formFunc) as Promise<T>;
    };
}

// Extend the original classes with the middleware
export class BFActionFormData extends ActionFormData {
    constructor() {
        super();
        this.show = showMiddleware(this.show);
    }
}

export class BFModalFormData extends ModalFormData {
    constructor() {
        super();
        this.show = showMiddleware(this.show);
    }
}

export class BFMessageFormData extends MessageFormData {
    constructor() {
        super();
        this.show = showMiddleware(this.show);
    }
}