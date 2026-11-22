const pool = require('../config/db');

const createServiceError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const isValidDate = (date) => {
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return false;
    }

    const [year, month, day] = date.split('-').map(Number);
    const parsedDate = new Date(Date.UTC(year, month - 1, day));

    return (
        parsedDate.getUTCFullYear() === year &&
        parsedDate.getUTCMonth() === month - 1 &&
        parsedDate.getUTCDate() === day
    );
};

const validatePurchaseId = (id) => {
    const purchaseId = Number(id);
    if (!Number.isInteger(purchaseId) || purchaseId <= 0) {
        throw createServiceError('Invalid purchase ID', 400);
    }

    return purchaseId;
};

const validatePurchaseData = async ({
    supplier_id,
    invoice_number,
    purchase_date,
    items
}) => {
    const supplierId = Number(supplier_id);
    if (!Number.isInteger(supplierId) || supplierId <= 0) {
        throw createServiceError('Invalid supplier ID', 400);
    }

    const supplierResult = await pool.query(
        'SELECT id FROM suppliers WHERE id = $1',
        [supplierId]
    );
    if (supplierResult.rows.length === 0) {
        throw createServiceError('Supplier not found', 404);
    }

    if (typeof invoice_number !== 'string' || !invoice_number.trim()) {
        throw createServiceError('Invoice number is required', 400);
    }

    if (!isValidDate(purchase_date)) {
        throw createServiceError('Invalid purchase date', 400);
    }

    if (!Array.isArray(items) || items.length === 0) {
        throw createServiceError('At least one purchase item is required', 400);
    }

    for (const item of items) {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
            throw createServiceError('Invalid medicine ID', 400);
        }

        const medicineId = Number(item.medicine_id);
        if (!Number.isInteger(medicineId) || medicineId <= 0) {
            throw createServiceError('Invalid medicine ID', 400);
        }

        const medicineResult = await pool.query(
            'SELECT id FROM medicines WHERE id = $1',
            [medicineId]
        );
        if (medicineResult.rows.length === 0) {
            throw createServiceError('Medicine not found', 404);
        }

        if (
            typeof item.batch_number !== 'string' ||
            !item.batch_number.trim()
        ) {
            throw createServiceError('Batch number is required', 400);
        }

        if (!isValidDate(item.expiry_date)) {
            throw createServiceError('Invalid expiry date', 400);
        }

        if (
            !Number.isInteger(item.quantity_received) ||
            item.quantity_received <= 0
        ) {
            throw createServiceError(
                'Quantity received must be a positive integer',
                400
            );
        }

        if (
            typeof item.unit_cost !== 'number' ||
            !Number.isFinite(item.unit_cost) ||
            item.unit_cost < 0
        ) {
            throw createServiceError(
                'Unit cost must be a valid non-negative number',
                400
            );
        }
    }

    const totalAmount = items.reduce((total, item) => {
        return total + (item.quantity_received * item.unit_cost);
    }, 0);

    return {supplierId, totalAmount};
};

const getPurchases = async () => {
    const result = await pool.query(
        `SELECT
            purchases.*,
            suppliers.name AS supplier_name
         FROM purchases
         JOIN suppliers
         ON purchases.supplier_id = suppliers.id
         ORDER BY purchases.id`
    );

    return result.rows;
};

const getPurchaseById = async (id) => {
    const purchaseId = validatePurchaseId(id);
    const purchaseResult = await pool.query(
        `SELECT
            purchases.*,
            suppliers.name AS supplier_name
         FROM purchases
         JOIN suppliers
         ON purchases.supplier_id = suppliers.id
         WHERE purchases.id = $1`,
        [purchaseId]
    );

    if (purchaseResult.rows.length === 0) {
        throw createServiceError('Purchase not found', 404);
    }

    const itemsResult = await pool.query(
        `SELECT
            purchase_items.*,
            medicines.name AS medicine_name
         FROM purchase_items
         JOIN medicines
         ON purchase_items.medicine_id = medicines.id
         WHERE purchase_items.purchase_id = $1`,
        [purchaseId]
    );

    return {
        purchase: purchaseResult.rows[0],
        items: itemsResult.rows
    };
};

const createPurchase = async (purchaseData) => {
    const {supplierId, totalAmount} = await validatePurchaseData(purchaseData);
    const {invoice_number, purchase_date, items} = purchaseData;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const purchaseResult = await client.query(
            `INSERT INTO purchases
                (supplier_id, purchase_date, invoice_number, total_amount)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [supplierId, purchase_date, invoice_number, totalAmount]
        );

        const purchase = purchaseResult.rows[0];
        for (const item of items) {
            await client.query(
                `INSERT INTO purchase_items
                    (purchase_id, medicine_id, batch_number, expiry_date,
                     quantity_received, quantity_available, unit_cost)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    purchase.id,
                    item.medicine_id,
                    item.batch_number,
                    item.expiry_date,
                    item.quantity_received,
                    item.quantity_received,
                    item.unit_cost
                ]
            );
        }

        await client.query('COMMIT');
        return purchase;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const updatePurchase = async (id, purchaseData) => {
    const purchaseId = validatePurchaseId(id);
    const {supplierId, totalAmount} = await validatePurchaseData(purchaseData);
    const {invoice_number, purchase_date, items} = purchaseData;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const existingPurchase = await client.query(
            'SELECT id FROM purchases WHERE id = $1 FOR UPDATE',
            [purchaseId]
        );
        if (existingPurchase.rows.length === 0) {
            throw createServiceError('Purchase not found', 404);
        }

        const purchaseResult = await client.query(
            `UPDATE purchases
             SET supplier_id = $1,
                 invoice_number = $2,
                 purchase_date = $3,
                 total_amount = $4
             WHERE id = $5
             RETURNING *`,
            [
                supplierId,
                invoice_number.trim(),
                purchase_date,
                totalAmount,
                purchaseId
            ]
        );

        const purchase = purchaseResult.rows[0];
        await client.query(
            'DELETE FROM purchase_items WHERE purchase_id = $1',
            [purchaseId]
        );

        for (const item of items) {
            await client.query(
                `INSERT INTO purchase_items
                    (purchase_id, medicine_id, batch_number, expiry_date,
                     quantity_received, quantity_available, unit_cost)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    purchase.id,
                    item.medicine_id,
                    item.batch_number.trim(),
                    item.expiry_date,
                    item.quantity_received,
                    item.quantity_received,
                    item.unit_cost
                ]
            );
        }

        await client.query('COMMIT');
        return purchase;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    getPurchases,
    getPurchaseById,
    createPurchase,
    updatePurchase
};