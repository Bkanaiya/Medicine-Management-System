const pool = require('../config/db');

// Checks whether a date is a valid YYYY-MM-DD date
const isValidDate = (date) => {
    // Check whether the date is a string in the correct format
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return false;
    }

    // Extract year, month and day
    const [year, month, day] = date.split('-').map(Number);

    // Create a UTC date to check whether the date actually exists
    const parsedDate = new Date(Date.UTC(year, month - 1, day));

    // Ensure JavaScript did not automatically change the date
    return (
        parsedDate.getUTCFullYear() === year &&
        parsedDate.getUTCMonth() === month - 1 &&
        parsedDate.getUTCDate() === day
    );
};

const getPurchases = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                purchases.*,
                suppliers.name AS supplier_name
             FROM purchases
             JOIN suppliers
             ON purchases.supplier_id = suppliers.id
             ORDER BY purchases.id`
        );

        res.status(200).json(result.rows);

    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const getPurchaseById = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate purchase ID
        if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
            return res.status(400).json({
                message: 'Invalid purchase ID'
            });
        }

        // Get purchase and supplier information
        const purchaseResult = await pool.query(
            `SELECT
                purchases.*,
                suppliers.name AS supplier_name
             FROM purchases
             JOIN suppliers
             ON purchases.supplier_id = suppliers.id
             WHERE purchases.id = $1`,
            [id]
        );

        if (purchaseResult.rows.length === 0) {
            return res.status(404).json({
                message: 'Purchase not found'
            });
        }

        // Get purchase items
        const itemsResult = await pool.query(
            `SELECT
                purchase_items.*,
                medicines.name AS medicine_name
             FROM purchase_items
             JOIN medicines
             ON purchase_items.medicine_id = medicines.id
             WHERE purchase_items.purchase_id = $1`,
            [id]
        );

        res.status(200).json({
            purchase: purchaseResult.rows[0],
            items: itemsResult.rows
        });

    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const createPurchase = async (req, res) => {
    try {
        const { supplier_id, invoice_number, purchase_date, items } = req.body;

        // Validate supplier ID
        if (!Number.isInteger(Number(supplier_id)) || Number(supplier_id) <= 0) {
            return res.status(400).json({
                message: 'Invalid supplier ID'
            });
        }

        // Check whether supplier exists
        const supplierResult = await pool.query(
            'SELECT id FROM suppliers WHERE id = $1',
            [supplier_id]
        );

        if (supplierResult.rows.length === 0) {
            return res.status(404).json({
                message: 'Supplier not found'
            });
        }

        // Validate invoice number
        if (typeof invoice_number !== 'string' || invoice_number.trim() === '') {
            return res.status(400).json({
                message: 'Invoice number is required'
            });
        }

        // Validate purchase date
        if (
            typeof purchase_date !== 'string' ||
            !/^\d{4}-\d{2}-\d{2}$/.test(purchase_date) ||
            new Date(purchase_date).toISOString().slice(0, 10) !== purchase_date
        ) {
            return res.status(400).json({
                message: 'Invalid purchase date'
            });
        }

        // Validate items array
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                message: 'At least one purchase item is required'
            });
        }

        // Validate each purchase item
        for (const item of items) {

            // Validate medicine ID
            if (
                !Number.isInteger(Number(item.medicine_id)) ||
                Number(item.medicine_id) <= 0
            ) {
                return res.status(400).json({
                    message: 'Invalid medicine ID'
                });
            }

            // Check whether medicine exists
            const medicineResult = await pool.query(
                'SELECT id FROM medicines WHERE id = $1',
                [item.medicine_id]
            );

            if (medicineResult.rows.length === 0) {
                return res.status(404).json({
                    message: 'Medicine not found'
                });
            }

            // Validate batch number
            if (
                typeof item.batch_number !== 'string' ||
                item.batch_number.trim() === ''
            ) {
                return res.status(400).json({
                    message: 'Batch number is required'
                });
            }

            // Validate expiry date
            if (
                typeof item.expiry_date !== 'string' ||
                !/^\d{4}-\d{2}-\d{2}$/.test(item.expiry_date) ||
                new Date(item.expiry_date).toISOString().slice(0, 10) !== item.expiry_date
            ) {
                return res.status(400).json({
                    message: 'Invalid expiry date'
                });
            }

            // Validate quantity received
            if (
                !Number.isInteger(item.quantity_received) ||
                item.quantity_received <= 0
            ) {
                return res.status(400).json({
                    message: 'Quantity received must be a positive integer'
                });
            }

            // Validate unit cost
            if (
                typeof item.unit_cost !== 'number' ||
                !Number.isFinite(item.unit_cost) ||
                item.unit_cost < 0
            ) {
                return res.status(400).json({
                    message: 'Unit cost must be a valid non-negative number'
                });
            }
        }

        // Calculate total purchase amount
        const totalAmount = items.reduce((total, item) => {
            return total + (item.quantity_received * item.unit_cost);
        }, 0);

        // Acquire a database client
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Insert purchase header
            const purchaseResult = await client.query(
                `INSERT INTO purchases
                    (supplier_id, purchase_date, invoice_number, total_amount)
                 VALUES ($1, $2, $3, $4)
                 RETURNING *`,
                [supplier_id, purchase_date, invoice_number, totalAmount]
            );

            const purchase = purchaseResult.rows[0];
            // Insert purchase items
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

             // Commit the transaction
            await client.query('COMMIT');

            res.status(201).json({
                message: 'Purchase created successfully',
                purchase
            });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

        } catch (error) {
        console.error(error.message);

        if (error.code === '23505' && error.constraint === 'unique_supplier_invoice') {
            return res.status(409).json({
                message: 'Invoice number already exists for this supplier'
            });
        }

        res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const updatePurchase = async (req, res) => {
    try {
        // 1. Get the purchase ID from the URL
        const { id } = req.params;

        // Validate the purchase ID
        if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
            return res.status(400).json({
                message: 'Invalid purchase ID'
            });
        }

        // 2. Get the updated data from the request body
        const { supplier_id, invoice_number, purchase_date, items } = req.body;

        // 3. Validate supplier ID
        if (!Number.isInteger(Number(supplier_id)) || Number(supplier_id) <= 0) {
            return res.status(400).json({
                message: 'Invalid supplier ID'
            });
        }

        // 4. Check whether the supplier exists
        const supplierResult = await pool.query(
            'SELECT id FROM suppliers WHERE id = $1',
            [supplier_id]
        );

        if (supplierResult.rows.length === 0) {
            return res.status(404).json({
                message: 'Supplier not found'
            });
        }

        // 5. Validate invoice number
        if (
            typeof invoice_number !== 'string' ||
            invoice_number.trim() === ''
        ) {
            return res.status(400).json({
                message: 'Invoice number is required'
            });
        }

        // 6. Validate purchase date
        if (!isValidDate(purchase_date)) {
            return res.status(400).json({
                message: 'Invalid purchase date'
            });
        }

        // 7. Validate items array
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                message: 'At least one purchase item is required'
            });
        }

        // 8. Validate each purchase item
        for (const item of items) {

            // Validate medicine ID
            if (
                !Number.isInteger(Number(item.medicine_id)) ||
                Number(item.medicine_id) <= 0
            ) {
                return res.status(400).json({
                    message: 'Invalid medicine ID'
                });
            }

            // Check whether the medicine exists
            const medicineResult = await pool.query(
                'SELECT id FROM medicines WHERE id = $1',
                [item.medicine_id]
            );

            if (medicineResult.rows.length === 0) {
                return res.status(404).json({
                    message: 'Medicine not found'
                });
            }

            // Validate batch number
            if (
                typeof item.batch_number !== 'string' ||
                item.batch_number.trim() === ''
            ) {
                return res.status(400).json({
                    message: 'Batch number is required'
                });
            }

            // Validate expiry date
            if (!isValidDate(item.expiry_date)) {
                return res.status(400).json({
                    message: 'Invalid expiry date'
                });
            }

            // Validate quantity received
            if (
                !Number.isInteger(item.quantity_received) ||
                item.quantity_received <= 0
            ) {
                return res.status(400).json({
                    message: 'Quantity received must be a positive integer'
                });
            }

            // Validate unit cost
            if (
                typeof item.unit_cost !== 'number' ||
                !Number.isFinite(item.unit_cost) ||
                item.unit_cost < 0
            ) {
                return res.status(400).json({
                    message: 'Unit cost must be a valid non-negative number'
                });
            }
        }

        // 9. Calculate the updated total amount
        const totalAmount = items.reduce((total, item) => {
            return total + (item.quantity_received * item.unit_cost);
        }, 0);

        // 10. Get a database client for the transaction
        const client = await pool.connect();

        try {
            // Start the transaction
            await client.query('BEGIN');

            // Lock the purchase row while updating it
            const existingPurchase = await client.query(
                'SELECT id FROM purchases WHERE id = $1 FOR UPDATE',
                [id]
            );

            // Check whether the purchase exists
            if (existingPurchase.rows.length === 0) {
                await client.query('ROLLBACK');

                return res.status(404).json({
                    message: 'Purchase not found'
                });
            }

            // 11. Update the purchase header
            const purchaseResult = await client.query(
                `UPDATE purchases
                 SET supplier_id = $1,
                     invoice_number = $2,
                     purchase_date = $3,
                     total_amount = $4
                 WHERE id = $5
                 RETURNING *`,
                [
                    supplier_id,
                    invoice_number.trim(),
                    purchase_date,
                    totalAmount,
                    id
                ]
            );

            const purchase = purchaseResult.rows[0];

            // 12. Delete the existing purchase items
            await client.query(
                'DELETE FROM purchase_items WHERE purchase_id = $1',
                [id]
            );

            // 13. Insert the updated purchase items
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

            // 14. Commit the transaction
            await client.query('COMMIT');

            // 15. Send the success response
            res.status(200).json({
                message: 'Purchase updated successfully',
                purchase
            });

        } catch (error) {
            // If something fails, undo all transaction changes
            await client.query('ROLLBACK');
            throw error;

        } finally {
            // Release the client back to the connection pool
            client.release();
        }

    } catch (error) {
        console.error(error.message);

        // Handle duplicate supplier invoice numbers
        if (
            error.code === '23505' &&
            error.constraint === 'unique_supplier_invoice'
        ) {
            return res.status(409).json({
                message: 'Invoice number already exists for this supplier'
            });
        }

        // Handle foreign key violations
        if (error.code === '23503') {
            return res.status(409).json({
                message: 'Purchase items cannot be changed because they are referenced by another record'
            });
        }

        // Handle other errors
        res.status(500).json({
            message: 'Internal server error'
        });
    }
};

module.exports = { getPurchases,
    getPurchaseById,
    createPurchase,
    updatePurchase
 };