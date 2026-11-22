const saleService = require('../service/saleService');

const getSales = async (req, res) => {
    try {
        const sales = await saleService.getSales();
        res.status(200).json(sales);
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message || 'Failed to retrieve sales'
        });
    }
};

const getSaleById = async (req, res) => {
    try {
        const sale = await saleService.getSaleById(req.params.id);
        res.status(200).json(sale);
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message || 'Failed to retrieve sale'
        });
    }
};

const createSale = async (req, res) => {
    try {
        const sale = await saleService.createSale(req.body);

        res.status(201).json({
            message: 'Sale created successfully',
            sale
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message || 'Failed to create sale'
        });
    }
};

module.exports = {
    getSales,
    getSaleById,
    createSale
};