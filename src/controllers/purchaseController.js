
const purchaseService = require('../service/purchaseService');

const getPurchases = async (req, res) => {
    const purchases = await purchaseService.getPurchases();
    res.status(200).json(purchases);
};

const getPurchaseById = async (req, res) => {
    const { id } = req.params;
    const purchaseDetails = await purchaseService.getPurchaseById(id);
    res.status(200).json(purchaseDetails);
};

const createPurchase = async (req, res) => {
    const purchase = await purchaseService.createPurchase(req.body);

    res.status(201).json({
        message: 'Purchase created successfully',
        purchase
    });
};

const updatePurchase = async (req, res) => {
    const { id } = req.params;
    const purchase = await purchaseService.updatePurchase(id, req.body);

    res.status(200).json({
        message: 'Purchase updated successfully',
        purchase
    });
};

module.exports = {
    getPurchases,
    getPurchaseById,
    createPurchase,
    updatePurchase
};
