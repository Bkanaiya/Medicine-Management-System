const pool = require('../config/db');

const createServiceError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const validateSupplierId = (id) => {
    const supplierId = Number(id);
    if (!Number.isInteger(supplierId) || supplierId <= 0) {
        throw createServiceError('Invalid supplier ID', 400);
    }

    return supplierId;
};

const getSuppliers = async () => {
    const result = await pool.query(
        'SELECT * FROM suppliers ORDER BY id'
    );
    return result.rows;
};

const getSupplierById = async (id) => {
    const supplierId = validateSupplierId(id);
    const result = await pool.query(
        'SELECT * FROM suppliers WHERE id = $1',
        [supplierId]
    );

    if (result.rows.length === 0) {
        throw createServiceError('Supplier not found', 404);
    }

    return result.rows[0];
};

const createSupplier = async ({name, phone, email, address}) => {
    if (typeof name !== 'string' || !name.trim()) {
        throw createServiceError('Supplier name is required', 400);
    }

    const result = await pool.query(
        `INSERT INTO suppliers (name, phone, email, address)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [
            name.trim(),
            phone || null,
            email || null,
            address || null
        ]
    );

    return result.rows[0];
};

const updateSupplier = async (id, {name, phone, email, address}) => {
    const supplierId = validateSupplierId(id);

    if (typeof name !== 'string' || !name.trim()) {
        throw createServiceError('Supplier name is required', 400);
    }

    const result = await pool.query(
        `UPDATE suppliers
         SET name = $1,
             phone = $2,
             email = $3,
             address = $4
         WHERE id = $5
         RETURNING *`,
        [
            name.trim(),
            phone || null,
            email || null,
            address || null,
            supplierId
        ]
    );

    if (result.rows.length === 0) {
        throw createServiceError('Supplier not found', 404);
    }

    return result.rows[0];
};

const deleteSupplier = async (id) => {
    const supplierId = validateSupplierId(id);
    const result = await pool.query(
        'DELETE FROM suppliers WHERE id = $1 RETURNING *',
        [supplierId]
    );

    if (result.rows.length === 0) {
        throw createServiceError('Supplier not found', 404);
    }

    return result.rows[0];
};

module.exports = {
    getSuppliers,
    getSupplierById,
    createSupplier,
    updateSupplier,
    deleteSupplier
};