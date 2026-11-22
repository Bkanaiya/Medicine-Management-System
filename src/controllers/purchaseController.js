const purchaseService = require('../service/purchaseService');

const handleError = (res, error, foreignKeyMessage) => {
    if (
        error.code === '23505' &&
        error.constraint === 'unique_supplier_invoice'
    ) {
        return res.status(409).json({
            message: 'Invoice number already exists for this supplier'
        });
    }

    if (error.code === '23503' && foreignKeyMessage) {
        return res.status(409).json({
            message: foreignKeyMessage
        });
    }

    const statusCode = error.statusCode || 500;
    if (statusCode === 500) {
        console.error(error.message);
    }

    return res.status(statusCode).json({
        message: statusCode === 500
            ? 'Internal server error'
            : error.message
    });
};

const getPurchases = async (req, res) => {
    try {
        const purchases = await purchaseService.getPurchases();
        return res.status(200).json(purchases);
    } catch (error) {
        return handleError(res, error);
    }
};

const getPurchaseById = async (req, res) => {
    try {
        const {id} = req.params;
        const purchaseDetails = await purchaseService.getPurchaseById(id);
        return res.status(200).json(purchaseDetails);
    } catch (error) {
        return handleError(res, error);
    }
};

const createPurchase = async (req, res) => {
    try {
        const purchase = await purchaseService.createPurchase(req.body);
        return res.status(201).json({
            message: 'Purchase created successfully',
            purchase
        });
    } catch (error) {
        return handleError(res, error);
    }
};

const updatePurchase = async (req, res) => {
    try {
        const {id} = req.params;
        const purchase = await purchaseService.updatePurchase(id, req.body);
        return res.status(200).json({
            message: 'Purchase updated successfully',
            purchase
        });
    } catch (error) {
        return handleError(
            res,
            error,
            'Purchase items cannot be changed because they are referenced by another record'
        );
    }
};

module.exports = {
    getPurchases,
    getPurchaseById,
    createPurchase,
    updatePurchase
};
