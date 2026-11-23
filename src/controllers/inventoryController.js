const inventoryService = require('../service/inventoryService');

const createControllerError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const getInventory = async (req, res) => {
    const inventory = await inventoryService.getInventory();
    res.status(200).json(inventory);
};

const getInventoryById = async (req, res) => {
    const inventory = await inventoryService.getInventoryById(req.params.id);

    if (!inventory) {
        throw createControllerError('Inventory item not found', 404);
    }

    res.status(200).json(inventory);
};

const getLowStockInventory = async (req, res) => {
    const inventory = await inventoryService.getLowStockInventory();
    res.status(200).json(inventory);
};

const getExpiringInventory = async (req, res) => {
    const daysInput = req.query.days;

    if (
        daysInput !== undefined &&
        !/^\d+$/.test(daysInput)
    ) {
        throw createControllerError(
            'Days must be a positive integer between 1 and 3650',
            400
        );
    }

    const days = daysInput === undefined ? 30 : Number(daysInput);

    if (!Number.isSafeInteger(days) || days <= 0 || days > 3650) {
        throw createControllerError(
            'Days must be a positive integer between 1 and 3650',
            400
        );
    }

    const inventory = await inventoryService.getExpiringInventory(days);
    res.status(200).json(inventory);
};

const getExpiredInventory = async (req, res) => {
    const inventory = await inventoryService.getExpiredInventory();
    res.status(200).json(inventory);
};

module.exports = {
    getInventory,
    getInventoryById,
    getLowStockInventory,
    getExpiringInventory,
    getExpiredInventory
};
