import { system, world } from "@minecraft/server";
import { hexToText, log, Server, sleep, textToHex } from "../tool/tools";

export class CMDLinker {
    cmd: string;
    item_id: string;
    [key: string]: any;

    constructor(cmd: string, item_id: string) {
        this.cmd = cmd;
        this.item_id = item_id;
    }

    static fromObject(obj: any) {
        return new CMDLinker(obj.cmd, obj.item_id);
    }

    static async initDB_link() {
            if (db_link.size === 0) {
                const objectiveName = "db_link";
                await Server.runCommandAsync(`scoreboard objectives add ${objectiveName} dummy`);
                const start = Date.now();
        
                try {
                    const objective = world.scoreboard.getObjective(objectiveName) ?? world.scoreboard.addObjective("db_link", "");
                    const sc = objective.getScores();
                    
                    const nbParticipants = sc.length;
                    const batchSize = 83 >>> 0;
                    const batchNumber = Math.ceil(nbParticipants / batchSize);
        
                    const progressBar = "§a[DB] §7loading db_link... §e";
                    const percentageUnit = 100 / nbParticipants;
                    loadDatabase.link = progressBar + "0.00%";
        
                    for (let i = 0; i < batchNumber; i++) {
                        const batchStart = i * batchSize;
                        const batchEnd = batchStart + batchSize;
                        const batch = batchEnd < nbParticipants ? sc.slice(batchStart, batchEnd) : sc.slice(batchStart);
        
                        const updateDbLinkPromises = batch.map(async (score, i) => {
                            const db = score.participant.displayName.match(/(?<=\$db_link\()[0-9a-f\s]+(?=\))/g);
                            if (!db) {
                                log("§cError: Mismatch data in db_link, try deleting the database and restarting the server. Contact the developer.");
                                return;
                            }
                            const linkObj = JSON.parse(hexToText(db.join(""))) as CMDLinker;
                            let link = CMDLinker.fromObject(linkObj);
                            
                            // Update db_link map
                            const existingLink = db_link.get(link.item_id);
        
                            if (existingLink) {
                                // Update existing link data
                                log(`§cDuplicate CMDLink found, fixing ${link.item_id}`)
                                objective.removeParticipant(score.participant);
                                if (existingLink.timePlayed < link.timePlayed) {
                                    existingLink.remove_to_update_link();
                                    link = existingLink;
                                    link.add_to_update_link();
                                }
                            } else {
                                db_link.set(link.item_id, link);
                            }
                        });
                        await sleep(1);
                        // Update progress bar
                        loadDatabase.link = progressBar + (batchEnd * percentageUnit).toFixed(2) + "%";
                        await Promise.all(updateDbLinkPromises);
                    }
                    loadDatabase.link = progressBar + "100%";
                } catch (e) {
                    log("§7[DB] can't find any database for db_link, creating a new one " + e);
                }
        
                const end = Date.now();
                log("§7db_link loaded in " + ((end - start) / 1000) + " second(s)");
                globalThis.isLoaded = true;
            }
        }
    
        static async UpdateDB() {
            if (db_link.size > 0 && isLoaded === false) {
                let counter = 0;
                const progressBar = "§a[DB] §7updating db_link... §e";
                const percentageUnit = 100 / db_link.size;
                for (let obj of db_link.values()) {
                    obj.remove_to_update_link();
                    let new_obj = new CMDLinker("", "");
    
                    for (const newKey in new_obj) {
                        if (new_obj.hasOwnProperty(newKey)) {
                            if (!obj.hasOwnProperty(newKey)) {
                                obj[newKey] = new_obj[newKey];
                            }
                        }
                    }
                    for (const oldKey in obj) {
                        if (obj.hasOwnProperty(oldKey)) {
                            if (!new_obj.hasOwnProperty(oldKey)) {
                                delete obj[oldKey];
                            }
                        }
                    }
    
                    obj.add_to_update_link();
                    if (++counter % 37 === 0) {
                        loadDatabase.link = progressBar + (counter * percentageUnit).toFixed(2) + "%";
                        await sleep(1);
                    }
                }
                log("§8[CMDLink] §7Database Updated");
            }
            else {
                log("cannot update database")
            }
        }
    
    
        remove_to_update_link() {
            if (this === undefined) return;
            const scoreboard = world.scoreboard.getObjective("db_link")!;
            scoreboard.removeParticipant(`$db_link(${textToHex(JSON.stringify(this))})`);
            // Server.runCommandAsync("scoreboard links reset \"$db_link(" + textToHex(JSON.stringify(this)) + ")\" db_link");
        }
    
        add_to_update_link() {
            if (this === undefined) return;
            const scoreboard = world.scoreboard.getObjective("db_link")!;
            scoreboard.addScore(`$db_link(${textToHex(JSON.stringify(this))})`, 1);
            // Server.runCommandAsync("scoreboard links set \"$db_link(" + textToHex(JSON.stringify(this)) + ")\" db_link 1");
        }
    
    
        static add_link(link: CMDLinker | undefined) {
            if (link === undefined) return;
            if (db_link.has(link.item_id)) {
                log(`§cDuplicate link found, fixing ${link.item_id}`);
                CMDLinker.remove_link(db_link.get(link.item_id));
            }
            db_link.set(link.item_id, link);
            const scoreboard = world.scoreboard.getObjective("db_link")!;
            system.run(() => {
                scoreboard.addScore(`$db_link(${textToHex(JSON.stringify(link))})`, 1);
            });
            // Server.runCommandAsync("scoreboard links set \"$db_link(" + textToHex(JSON.stringify(link)) + ")\" db_link 1");
        }
    
        static remove_link(link: CMDLinker | undefined) {
            if (link === undefined) return;
            const scoreboard = world.scoreboard.getObjective("db_link")!;
            system.run(() => {
            scoreboard.removeParticipant(`$db_link(${textToHex(JSON.stringify(link))})`);
            });
            // Server.runCommandAsync("scoreboard links reset \"$db_link(" + textToHex(JSON.stringify(link)) + ")\" db_link");
            db_link.delete(link.item_id);
        }
}


export let db_link: Map<CMDLinker['item_id'], CMDLinker> = new Map<CMDLinker['item_id'], CMDLinker>();