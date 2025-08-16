import { ItemCooldownComponent, ItemDurabilityComponent, ItemEnchantableComponent, ItemStack, EnchantmentType } from '@minecraft/server';
export class ItemStackSerializer {
    static serialize(itemStack) {
        const serializedData = {
            amount: itemStack.amount,
            isStackable: itemStack.isStackable,
            keepOnDeath: itemStack.keepOnDeath,
            lockMode: itemStack.lockMode,
            maxAmount: itemStack.maxAmount,
            nameTag: itemStack.nameTag,
            tags: itemStack.getTags(),
            type: itemStack['type'],
            typeId: itemStack.typeId,
            components: itemStack.getComponents().map(component => ItemStackSerializer.serializeComponent(component)),
            dynamicsPropertiesIds: itemStack.getDynamicPropertyIds(),
            dynamicsProperties: itemStack.getDynamicPropertyIds().map(id => itemStack.getDynamicProperty(id)),
            lore: itemStack.getLore(),
            canDestroy: itemStack.getCanDestroy(),
            canPlaceOn: itemStack.getCanPlaceOn()
        };
        return JSON.stringify(serializedData);
    }
    static serializeComponent(component) {
        const serializedData = {
            typeId: component.constructor.name,
        };
        if (component instanceof ItemEnchantableComponent) {
            const enchantments = component.getEnchantments().map(enchantment => ({
                type: enchantment.type instanceof EnchantmentType ? enchantment.type.id : enchantment.type,
                level: enchantment.level
            }));
            serializedData.enchantments = enchantments;
            serializedData.typeId = component.typeId;
        }
        if (component instanceof ItemDurabilityComponent) {
            serializedData.damage = component.damage;
            serializedData.maxDurability = component.maxDurability;
            serializedData.typeId = component.typeId;
        }
        if (component instanceof ItemCooldownComponent) {
            serializedData.cooldown = component.cooldownCategory;
            serializedData.typeId = component.typeId;
        }
        return serializedData;
    }
    static deserialize(serializedData) {
        const data = JSON.parse(serializedData);
        const itemStack = new ItemStack(data.typeId, data.amount);
        itemStack.keepOnDeath = data.keepOnDeath;
        itemStack.lockMode = data.lockMode;
        itemStack.nameTag = data.nameTag;
        itemStack.setLore(data.lore);
        for (let i = 0; i < data.dynamicsPropertiesIds.length; i++) {
            itemStack.setDynamicProperty(data.dynamicsPropertiesIds[i], data.dynamicsProperties[i]);
        }
        itemStack.setCanDestroy(data.canDestroy);
        itemStack.setCanPlaceOn(data.canPlaceOn);
        data.components.forEach((componentData) => {
            ItemStackSerializer.deserializeComponent(componentData, itemStack);
        });
        return itemStack;
    }
    static deserializeComponent(data, itemStack) {
        const component = itemStack.getComponent(data.typeId);
        if (component instanceof ItemEnchantableComponent) {
            data.enchantments.forEach((enchantmentData) => {
                component.addEnchantment(enchantmentData);
            });
        }
        if (component instanceof ItemDurabilityComponent) {
            if (data.damage < 0)
                data.damage = 0;
            else if (data.damage > component.maxDurability)
                data.damage = component.maxDurability;
            component.damage = data.damage;
        }
    }
}
//# sourceMappingURL=main.js.map