const express = require('express');
const inventoryController = require('../controllers/inventoryController');

const router = express.Router();

router.get('/', inventoryController.getInventory);
router.get('/low-stock', inventoryController.getLowStockInventory);
router.get('/expiring', inventoryController.getExpiringInventory);
router.get('/expired', inventoryController.getExpiredInventory);
router.get('/:id', inventoryController.getInventoryById);


module.exports = router;