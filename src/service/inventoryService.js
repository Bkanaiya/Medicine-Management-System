const pool = require('../config/db');

const createServiceError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const validateInventoryId = (id) => {
    if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id) <= 0) {
        throw createServiceError('Invalid inventory ID', 400);
}
};

const getInventory = async () => {
    const result = await pool.query(
        `SELECT
            pi.id AS purchase_item_id,
            pi.medicine_id,
            m.name AS medicine_name,
            m.brand,
            m.unit,
            pi.batch_number,
            pi.expiry_date::text AS expiry_date,
            pi.quantity_received,
            pi.quantity_available,
            pi.unit_cost,
            m.selling_price
         FROM purchase_items pi
         JOIN medicines m
         ON pi.medicine_id = m.id
         ORDER BY m.name, pi.expiry_date`
    );

    return result.rows;
};

const getInventoryById = async (id) => {
    validateInventoryId(id);
    const result = await pool.query(
        `SELECT
            pi.id AS purchase_item_id,
            pi.medicine_id,
            m.name AS medicine_name,
            m.brand,
            m.unit,
            pi.batch_number,
            pi.expiry_date::text AS expiry_date,
            pi.quantity_received,
            pi.quantity_available,
            pi.unit_cost,
            m.selling_price
         FROM purchase_items pi
         JOIN medicines m
         ON pi.medicine_id = m.id
         WHERE pi.id = $1`,
        [id]
    );

    return result.rows[0];
};

const getLowStockInventory = async () => {
    const result = await pool.query(
        `SELECT
            m.id AS medicine_id,
            m.name AS medicine_name,
            m.brand,
            m.unit,
            m.reorder_level,
            COALESCE(SUM(pi.quantity_available), 0) AS total_stock
         FROM medicines m
         LEFT JOIN purchase_items pi
         ON m.id = pi.medicine_id
         AND pi.expiry_date >= CURRENT_DATE
         GROUP BY m.id, m.name, m.brand, m.unit, m.reorder_level
         HAVING COALESCE(SUM(pi.quantity_available), 0) <= m.reorder_level
         ORDER BY total_stock ASC`
    );

    return result.rows;
};

const getExpiringInventory = async (days = 30) => {
    const result = await pool.query(
        `SELECT
            pi.id AS purchase_item_id,
            pi.medicine_id,
            m.name AS medicine_name,
            m.brand,
            m.unit,
            pi.batch_number,
            pi.expiry_date::text AS expiry_date,
            pi.quantity_received,
            pi.quantity_available,
            pi.unit_cost,
            m.selling_price
         FROM purchase_items pi
         JOIN medicines m
         ON pi.medicine_id = m.id
         WHERE pi.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + $1::integer
         AND pi.quantity_available > 0
         ORDER BY pi.expiry_date ASC`,
        [days]
    );

    return result.rows;
};

const getExpiredInventory = async () => {
    const result = await pool.query(
        `SELECT
            pi.id AS purchase_item_id,
            pi.medicine_id,
            m.name AS medicine_name,
            m.brand,
            m.unit,
            pi.batch_number,
            pi.expiry_date::text AS expiry_date,
            pi.quantity_received,
            pi.quantity_available,
            pi.unit_cost,
            m.selling_price
         FROM purchase_items pi
         JOIN medicines m
         ON pi.medicine_id = m.id
         WHERE pi.expiry_date < CURRENT_DATE
         AND pi.quantity_available > 0
         ORDER BY pi.expiry_date ASC`
    );

    return result.rows;
};

module.exports = { getInventory,
    getInventoryById,
    getLowStockInventory,
    getExpiringInventory,
    getExpiredInventory
 };