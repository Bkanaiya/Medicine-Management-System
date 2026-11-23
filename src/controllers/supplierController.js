
const supplierService = require('../service/supplierService');

const getSuppliers = async (req, res) => {
    const suppliers = await supplierService.getSuppliers();
    res.status(200).json(suppliers);
};

const getSupplierById = async (req, res) => {
    const { id } = req.params;
    const supplier = await supplierService.getSupplierById(id);
    res.status(200).json(supplier);
};

const createSupplier = async (req, res) => {
    const supplier = await supplierService.createSupplier(req.body);

    res.status(201).json({
        message: 'Supplier created successfully',
        supplier
    });
};

const updateSupplier = async (req, res) => {
    const { id } = req.params;
    const supplier = await supplierService.updateSupplier(id, req.body);

    res.status(200).json({
        message: 'Supplier updated successfully',
        supplier
    });
};

const deleteSupplier = async (req, res) => {
    const { id } = req.params;
    const supplier = await supplierService.deleteSupplier(id);

    res.status(200).json({
        message: 'Supplier deleted successfully',
        supplier
    });
};

module.exports = {
    getSuppliers,
    getSupplierById,
    createSupplier,
    updateSupplier,
    deleteSupplier
};
