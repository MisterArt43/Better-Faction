import { Entity } from "@minecraft/server";
import { factionRank } from "../faction/Faction";
import { Vector_3, Vector_3_Dim } from "../tool/object/Vector";

abstract class Shop {
	shopID: number;
	type: number;

	shopOwner: string;
	createTime: number;
	shopItemIDs: ShopItem['shopItemID'][];

	isOpen: boolean;

	constructor(shopID: number, type: number, shopOwner: string, shopItemIDs: ShopItem['shopItemID'][] = [], isOpen: boolean = true) {
		this.shopID = shopID;
		this.type = type;
		this.shopOwner = shopOwner;
		this.createTime = Date.now();
		this.shopItemIDs = shopItemIDs;
		this.isOpen = isOpen;
	}

	fromObject(obj: Shop) {
		this.shopID = obj.shopID;
		this.type = obj.type;
		this.shopOwner = obj.shopOwner;
		this.createTime = obj.createTime;
		this.shopItemIDs = obj.shopItemIDs;
		this.isOpen = obj.isOpen;
	}
}

class PlayerShop extends Shop {
	isFactionShop: boolean;
	factionName?: string;
	isCommandShop: boolean; //switch between command shop and physical shop
	shopLocation?: Vector_3_Dim; //if it's a physical shop

	constructor(shopID: number, type: number, shopOwner: string, shopItemIDs: ShopItem['shopItemID'][], isFactionShop: boolean, shopLocation: Vector_3_Dim, factionName?: string) {
		super(shopID, type, shopOwner, shopItemIDs);
		this.isFactionShop = isFactionShop;
		this.shopLocation = shopLocation;
		this.factionName = factionName;
	}

	fromObject(obj: Shop): void {
		super.fromObject(obj);
		this.isFactionShop = (obj as PlayerShop).isFactionShop;
		this.shopLocation = (obj as PlayerShop).shopLocation;
		this.factionName = (obj as PlayerShop).factionName;
	}
}

class NpcShop extends Shop {
	entityIDs: Entity['id'][];
	conditionToUse: {
		hasTag?: string;
		hasScore?: {
			objective: string;
			value: number;
		}
		minimumFactionRank?: keyof typeof factionRank;
	}
	openEvery?: {
		beginAt: number;
		day: number;
		hour: number;
		minute: number;
		duration: number;
	}
	eventOpen?: {
		eventName: string;
		beginDate: number;
		endDate: number;
	}

	constructor(shopID: number, type: number, shopOwner: string, shopItemIDs: ShopItem['shopItemID'][], entityIDs: Entity['id'][]) {
		super(shopID, type, shopOwner, shopItemIDs);
		this.entityIDs = entityIDs;
	}

	fromObject(obj: Shop): void {
		super.fromObject(obj);
		this.entityIDs = (obj as NpcShop).entityIDs;
	}
}

class BlockShop extends Shop {
	shopLocation: Vector_3_Dim[];
	conditionToUse: {
		hasTag?: string;
		hasScore?: {
			objective: string;
			value: number;
		}
		minimumFactionRank?: keyof typeof factionRank;
	}
	openEvery?: {
		beginDate: number;
		day: number;
		hour: number;
		minute: number;
		duration: number;
	}
	eventOpen?: {
		eventName: string;
		beginDate: number;
		endDate: number;
	}
	isSign: boolean;

	constructor(shopID: number, type: number, shopOwner: string, shopItemIDs: ShopItem['shopItemID'][], shopLocation: Vector_3_Dim[], isSign: boolean) {
		super(shopID, type, shopOwner, shopItemIDs);
		this.shopLocation = shopLocation;
		this.isSign = isSign;
	}

	fromObject(obj: Shop): void {
		super.fromObject(obj);
		this.shopLocation = (obj as BlockShop).shopLocation;
		this.isSign = (obj as BlockShop).isSign;
	}
}

class CommandShop extends Shop {
	conditionToUse: {
		hasTag?: string;
		hasScore?: {
			objective: string;
			value: number;
		}
		minimumFactionRank?: keyof typeof factionRank;
		locationBetween?: {
			min: Vector_3;
			max: Vector_3;
			dimension: string;
		}
	}
	openEvery?: {
		beginDate: number;
		day: number;
		hour: number;
		minute: number;
		duration: number;
	}
	eventOpen?: {
		eventName: string;
		beginDate: number;
		endDate: number;
	}
}

// class ChestShop extends Shop {
// 	shopLocation: Vector_3_Dim;
// }

class ShopItem {
	shopItemID: number;
	shopID: Shop['shopID'] | null; // ID of the shop that this item belongs to (null if it's not in a shop)
	type: number;

	price: number; // the item price in the shop
	isInfinite: boolean; // if the item is infinite, it will not be removed from the shop when bought
	createTime: number;
	owner: string;

	category?: string[][];

	// depending on the type of the shop item
	itemData?: string; //Serealized itemStack
	commandData?: string; //run Minecraft command
	bundleData?: ShopItem['shopItemID'][]; //Pack of ShopItem (can be item + bundle + command) - /!\ recursive

	itemAmount?: number;
	itemDescription?: string;
	timeExpiration?: number; // if it's an item, it will be removed from the shop after this time

	// if it's an item, it will edit the item's lore to add the date of purchase
	updateLore?: boolean;

	conditionToBuy?: {
		hasTag?: string;
		hasScore?: {
			objective: string;
			value: number;
		}
		minimumFactionRank?: keyof typeof factionRank;
	}

	constructor(shopItemID: number, shopID: number, type: number, price: number, isInfinite: boolean, owner: string, itemData?: string, commandData?: string, bundleData?: ShopItem['shopItemID'][], itemAmount?: number, itemDescription?: string, timeExpiration?: number, updateLore?: boolean, conditionToBuy?: ShopItem['conditionToBuy'], category?: string[][]) {
		this.shopItemID = shopItemID;
		this.shopID = shopID;
		this.type = type;
		this.price = price;
		this.isInfinite = isInfinite;
		this.createTime = Date.now();
		this.owner = owner;
		this.itemData = itemData;
		this.commandData = commandData;
		this.bundleData = bundleData;
		this.itemAmount = itemAmount;
		this.itemDescription = itemDescription;
		this.timeExpiration = timeExpiration;
		this.updateLore = updateLore;
		this.conditionToBuy = conditionToBuy;
		this.category = category;
	}

	fromObject(obj: ShopItem): void {
		this.shopItemID = obj.shopItemID;
		this.shopID = obj.shopID;
		this.type = obj.type;
		this.price = obj.price;
		this.isInfinite = obj.isInfinite;
		this.createTime = obj.createTime;
		this.owner = obj.owner;
		this.itemData = obj.itemData;
		this.commandData = obj.commandData;
		this.bundleData = obj.bundleData;
		this.itemAmount = obj.itemAmount;
		this.itemDescription = obj.itemDescription;
		this.timeExpiration = obj.timeExpiration;
		this.updateLore = obj.updateLore;
		this.conditionToBuy = obj.conditionToBuy;
		this.category = obj.category;
	}
}

export const shopItemType = {
	item: 0,
	bundle: 1,
	command: 2,
} as const

export const shopType = {
	playerShop: 0,
	npcShop: 1,
	blockShop: 2,
	commandShop: 3,
	// chestShop: ,
} as const

export const playerShopType = {
	command: 0,
	shop: 1,
} as const

export type ShopItemType = typeof shopItemType[keyof typeof shopItemType];
export type ShopType = typeof shopType[keyof typeof shopType];
export type PlayerShopType = typeof playerShopType[keyof typeof playerShopType];