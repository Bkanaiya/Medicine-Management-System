
const pool = require('../config/db');

const createServiceError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const validateSaleId = (id) => {
    const saleId = Number(id);

    if (!Number.isInteger(saleId) || saleId <= 0) {
        throw createServiceError('Invalid sale ID', 400);
    }

    return saleId;
};

const validateSaleData = ({ payment_method, items }) => {
    if (
        typeof payment_method !== 'string' ||
        !payment_method.trim()
    ) {
        throw createServiceError('Payment method is required', 400);
    }

    if (payment_method.trim().length > 30) {
        throw createServiceError(
            'Payment method cannot exceed 30 characters',
            400
        );
    }

    if (!Array.isArray(items) || items.length === 0) {
        throw createServiceError(
            'At least one sale item is required',
            400
        );
    }

    const batchIds = new Set();

    for (const item of items) {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
            throw createServiceError('Invalid purchase item ID', 400);
        }

        const purchaseItemId = Number(item.purchase_item_id);

        if (
            !Number.isInteger(purchaseItemId) ||
            purchaseItemId <= 0
        ) {
            throw createServiceError('Invalid purchase item ID', 400);
        }

        if (batchIds.has(purchaseItemId)) {
            throw createServiceError(
                'Duplicate purchase item IDs are not allowed',
                400
            );
        }

        batchIds.add(purchaseItemId);

        if (
            !Number.isInteger(item.quantity) ||
            item.quantity <= 0
        ) {
            throw createServiceError(
                'Quantity sold must be a positive integer',
                400
            );
        }
    }
};

const getSales = async () => {
    const result = await pool.query(
        `SELECT
            sales.*,
            COUNT(sale_items.id) AS item_count
         FROM sales
         LEFT JOIN sale_items
         ON sales.id = sale_items.sale_id
         GROUP BY sales.id
         ORDER BY sales.id`
    );

    return result.rows;
};

const getSaleById = async (id) => {
    const saleId = validateSaleId(id);

    const saleResult = await pool.query(
        'SELECT * FROM sales WHERE id = $1',
        [saleId]
    );

    if (saleResult.rows.length === 0) {
        throw createServiceError('Sale not found', 404);
    }

    const itemsResult = await pool.query(
        `SELECT
            sale_items.*,
            medicines.name AS medicine_name,
            purchase_items.batch_number,
            purchase_items.expiry_date
         FROM sale_items
         JOIN purchase_items
         ON sale_items.purchase_item_id = purchase_items.id
         JOIN medicines
         ON purchase_items.medicine_id = medicines.id
         WHERE sale_items.sale_id = $1
         ORDER BY sale_items.id`,
        [saleId]
    );

    return {
        sale: saleResult.rows[0],
        items: itemsResult.rows
    };
};

const createSale = async (saleData) => {
    validateSaleData(saleData);

    const { payment_method, items } = saleData;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const validatedItems = [];
        let totalAmountCents = 0;

        for (const item of items) {
            const purchaseItemId = Number(item.purchase_item_id);

            const batchResult = await client.query(
                `SELECT
                    pi.id,
                    pi.medicine_id,
                    pi.batch_number,
                    pi.expiry_date,
                    pi.quantity_available,
                    m.name AS medicine_name,
                    m.selling_price,
                    m.is_active,
                    (pi.expiry_date < CURRENT_DATE) AS is_expired
                 FROM purchase_items pi
                 JOIN medicines m
                 ON pi.medicine_id = m.id
                 WHERE pi.id = $1
                 FOR UPDATE OF pi`,
                [purchaseItemId]
            );

            if (batchResult.rows.length === 0) {
                throw createServiceError('Purchase item not found', 404);
            }

            const batch = batchResult.rows[0];

            if (!batch.is_active) {
                throw createServiceError(
                    'Medicine is inactive',
                    400
                );
            }

            if (batch.is_expired) {
                throw createServiceError(
                    'Cannot sell an expired medicine batch',
                    400
                );
            }

            if (batch.quantity_available < item.quantity) {
                throw createServiceError(
                    `Insufficient stock for ${batch.medicine_name}`,
                    400
                );
            }

            const unitPriceCents = Math.round(
                Number(batch.selling_price) * 100
            );

            const subtotalCents = unitPriceCents * item.quantity;

            totalAmountCents += subtotalCents;

            validatedItems.push({
                purchase_item_id: purchaseItemId,
                quantity: item.quantity,
                unit_price: unitPriceCents / 100,
                subtotal: subtotalCents / 100
            });
        }

        const totalAmount = totalAmountCents / 100;

        const saleResult = await client.query(
            `INSERT INTO sales (total_amount, payment_method)
             VALUES ($1, $2)
             RETURNING *`,
            [totalAmount, payment_method.trim()]
        );

        const sale = saleResult.rows[0];

        for (const item of validatedItems) {
            await client.query(
                `INSERT INTO sale_items
                    (sale_id, purchase_item_id, quantity,
                     unit_price, subtotal)
                 VALUES ($1, $2, $3, $4, $5)`,
                [
                    sale.id,
                    item.purchase_item_id,
                    item.quantity,
                    item.unit_price,
                    item.subtotal
                ]
            );

            await client.query(
                `UPDATE purchase_items
                 SET quantity_available = quantity_available - $1
                 WHERE id = $2`,
                [item.quantity, item.purchase_item_id]
            );
        }

        await client.query('COMMIT');

        return sale;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    getSales,
    getSaleById,
    createSale
};
