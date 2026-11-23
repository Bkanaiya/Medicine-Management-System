const inventoryService = require('../service/inventoryService');

const getInventory = async (req, res) => {
    try {
        const inventory = await inventoryService.getInventory();
        res.status(200).json(inventory);
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message || 'Failed to fetch inventory'
        });
    }
};

const getInventoryById = async (req, res) => {
    try {
        const inventory = await inventoryService.getInventoryById(req.params.id);

        if (!inventory) {
            return res.status(404).json({
                message: 'Inventory item not found'
            });
        }

        res.status(200).json(inventory);
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message || 'Failed to fetch inventory item'
        });
    }
};

const getLowStockInventory = async (req, res) => {
    try {
        const inventory = await inventoryService.getLowStockInventory();
        res.status(200).json(inventory);
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message || 'Failed to fetch low-stock inventory'
        });
    }
};

const getExpiringInventory = async (req, res) => {
    try {
        const daysInput = req.query.days;

        if (
            daysInput !== undefined &&
            !/^\d+$/.test(daysInput)
        ) {
            return res.status(400).json({
                message: 'Days must be a positive integer between 1 and 3650'
        });
        }

        const days = daysInput === undefined ? 30 : Number(daysInput);

        if (!Number.isSafeInteger(days) || days <= 0 || days > 3650) {
            return res.status(400).json({
                message: 'Days must be a positive integer between 1 and 3650'
            });
        }

        const inventory = await inventoryService.getExpiringInventory(days);
        res.status(200).json(inventory);
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message || 'Failed to fetch expiring inventory'
        });
    }
};

const getExpiredInventory = async (req, res) => {
    try {
        const inventory = await inventoryService.getExpiredInventory();
        res.status(200).json(inventory);
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message || 'Failed to fetch expired inventory'
        });
    }
};


module.exports = { getInventory,
    getInventoryById,
    getLowStockInventory,
    getExpiringInventory,
    getExpiredInventory
 };