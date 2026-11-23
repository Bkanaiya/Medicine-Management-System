const saleService = require('../service/saleService');

const getSales = async (req, res) => {
    const sales = await saleService.getSales();
    res.status(200).json(sales);
};

const getSaleById = async (req, res) => {
    const sale = await saleService.getSaleById(req.params.id);
    res.status(200).json(sale);
};

const createSale = async (req, res) => {
    const sale = await saleService.createSale(req.body);

    res.status(201).json({
        message: 'Sale created successfully',
        sale
    });
};

module.exports = {
    getSales,
    getSaleById,
    createSale
};
