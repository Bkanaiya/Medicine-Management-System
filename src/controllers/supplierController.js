const pool = require('../config/db');

const getSuppliers = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM suppliers ORDER BY id'
        );

        res.status(200).json(result.rows);

    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const getSupplierById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
            return res.status(400).json({
                message: 'Invalid supplier ID'
            });
        }

        const result = await pool.query(
            'SELECT * FROM suppliers WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Supplier not found'
            });
        }

        res.status(200).json(result.rows[0]);

    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const createSupplier = async (req, res) => {
    try {
        const { name, phone, email, address } = req.body;

        // Validate required fields
        if (!name || !name.trim()) {
            return res.status(400).json({
                message: 'Supplier name is required'
            });
        }

        // Insert supplier
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

        res.status(201).json({
            message: 'Supplier created successfully',
            supplier: result.rows[0]
        });

    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const updateSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, email, address } = req.body;

        // Validate supplier ID
        if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
            return res.status(400).json({
                message: 'Invalid supplier ID'
            });
        }

        // Validate supplier name
        if (!name || !name.trim()) {
            return res.status(400).json({
                message: 'Supplier name is required'
            });
        }

        // Update supplier
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
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Supplier not found'
            });
        }

        res.status(200).json({
            message: 'Supplier updated successfully',
            supplier: result.rows[0]
        });

    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const deleteSupplier = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate supplier ID
        if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
            return res.status(400).json({
                message: 'Invalid supplier ID'
            });
        }

        const result = await pool.query(
            'DELETE FROM suppliers WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Supplier not found'
            });
        }

        res.status(200).json({
            message: 'Supplier deleted successfully',
            supplier: result.rows[0]
        });

    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: 'Internal server error'
        });
    }
};

module.exports = { getSuppliers,
    getSupplierById,
    createSupplier,
    updateSupplier,
    deleteSupplier
 };