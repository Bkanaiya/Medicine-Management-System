const express = require('express');
const saleController = require('../controllers/saleController');

const router = express.Router();

router.get('/', saleController.getSales);
router.get('/:id', saleController.getSaleById);
router.post('/',saleController.createSale)

module.exports = router;