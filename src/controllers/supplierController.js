const supplierService = require('../service/supplierService');

const handleError = (res, error) => {
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

const getSuppliers = async (req, res) => {
    try {
        const suppliers = await supplierService.getSuppliers();
        return res.status(200).json(suppliers);
    } catch (error) {
        return handleError(res, error);
    }
};

const getSupplierById = async (req, res) => {
    try {
        const { id } = req.params;
        const supplier = await supplierService.getSupplierById(id);
        return res.status(200).json(supplier);
    } catch (error) {
        return handleError(res, error);
    }
};

const createSupplier = async (req, res) => {
    try {
        const supplier = await supplierService.createSupplier(req.body);
        return res.status(201).json({
            message: 'Supplier created successfully',
            supplier
        });
    } catch (error) {
        return handleError(res, error);
    }
};

const updateSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        const supplier = await supplierService.updateSupplier(id, req.body);
        return res.status(200).json({
            message: 'Supplier updated successfully',
            supplier
        });
    } catch (error) {
        return handleError(res, error);
    }
};

const deleteSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        const supplier = await supplierService.deleteSupplier(id);
        return res.status(200).json({
            message: 'Supplier deleted successfully',
            supplier
        });
    } catch (error) {
        return handleError(res, error);
    }
};

module.exports = { getSuppliers,
    getSupplierById,
    createSupplier,
    updateSupplier,
    deleteSupplier
 };