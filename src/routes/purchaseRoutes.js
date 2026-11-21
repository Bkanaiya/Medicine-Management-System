const express = require('express');
const router = express.Router();

const { getPurchases,
    getPurchaseById,
    createPurchase,
    updatePurchase
} = require('../controllers/purchaseController');

router.get('/', getPurchases);
router.get('/:id',getPurchaseById);
router.post('/',createPurchase)
router.put('/:id',updatePurchase)

module.exports = router;