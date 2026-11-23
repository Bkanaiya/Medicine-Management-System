const pool = require('../config/db');
const translateCategoryDatabaseError = (error, operation) => {
    if (error.code === '23505') {
        const translatedError = new Error('Category name already exists');
        translatedError.statusCode = 409;
        return translatedError;
    }

    if (error.code === '23503' && operation === 'delete') {
        const translatedError = new Error(
            'Cannot delete category because medicines are associated with it'
        );
        translatedError.statusCode = 409;
        return translatedError;
    }

    return error;
};

const getAll = async ()=>{
    const result = await pool.query('Select *from categories');
    return result.rows;
}
const getById = async (id) => {
    const categoryId = Number(id);

    if (
        !/^\d+$/.test(id) ||
        !Number.isSafeInteger(categoryId) ||
        categoryId <= 0
    ) {
        const error = new Error('Invalid category id');
        error.statusCode = 400;
        throw error;
    }

    const result = await pool.query(
        'SELECT * FROM categories WHERE id=$1',
        [categoryId]
    );

    if (result.rows.length === 0) {
        const error = new Error('Category not found');
        error.statusCode = 404;
        throw error;
    }

    return result.rows[0];
};

const createCategory = async ({ name, description }) => {
    if (typeof name !== 'string' || !name.trim()) {
        const error = new Error('Category name is required');
        error.statusCode = 400;
        throw error;
    }

    let result;

    try {
        result = await pool.query(
            `INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *`,
            [name.trim(), description || null]
        );
    } catch (error) {
        throw translateCategoryDatabaseError(error, 'create');
    }

    return result.rows[0];
};

const updateCategory = async (id, { name, description }) => {
    const categoryId = Number(id);

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
        const error = new Error('Invalid category id');
        error.statusCode = 400;
        throw error;
    }

    if (typeof name !== 'string' || !name.trim()) {
        const error = new Error('Category name is required');
        error.statusCode = 400;
        throw error;
    }

    let result;

    try {
        result = await pool.query(
            `UPDATE categories SET name=$1, description=$2 WHERE id=$3 RETURNING *`,
            [name.trim(), description || null, categoryId]
        );
    } catch (error) {
        throw translateCategoryDatabaseError(error, 'update');
    }

    if (result.rows.length === 0) {
        const error = new Error('Category not found');
        error.statusCode = 404;
        throw error;
    }

    return result.rows[0];
};

const deleteCategory = async (id) => {
    const categoryId = Number(id);

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
        const error = new Error('Invalid category id');
        error.statusCode = 400;
        throw error;
    }

    let result;

    try {
        result = await pool.query(
            `DELETE FROM categories WHERE id=$1 RETURNING *`,
            [categoryId]
        );
    } catch (error) {
        throw translateCategoryDatabaseError(error, 'delete');
    }

    if (result.rows.length === 0) {
        const error = new Error('Category not found');
        error.statusCode = 404;
        throw error;
    }

    return result.rows[0];
};

module.exports = {getAll,
    getById,
    createCategory,
    updateCategory,
    deleteCategory
};