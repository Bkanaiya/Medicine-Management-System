const pool = require('../config/db');

const getAll = async ()=>{
    const result = await pool.query('Select *from categories');
    return result.rows;
}
const getById = async(id)=>{
    const result =await pool.query('select *from categories where id=$1',[id]);
    if(result.rows.length === 0){
        const error = new Error('Category not found');
        error.statusCode = 404;
        throw error;
    }
    return result.rows[0];
}

const createCategory = async ({name, description})=>{
    if (typeof name !== 'string' || !name.trim()) {
        const error = new Error('Category name is required');
        error.statusCode = 400;
        throw error;
    }

    const result = await pool.query(
        `INSERT INTO categories (name,description) VALUES ($1,$2) RETURNING *`,
        [name.trim(),description || null]
    );

    return result.rows[0];
}

const updateCategory = async (id, {name, description})=>{
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

    const result = await pool.query(
        `UPDATE categories SET name=$1, description=$2 where id=$3 RETURNING *`,
        [name.trim(),description || null,categoryId]
    );

    if (result.rows.length === 0) {
        const error = new Error('Category not found');
        error.statusCode = 404;
        throw error;
    }

    return result.rows[0];
}
const deleteCategory = async (id)=>{
    const categoryId = Number(id);
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
        const error = new Error('Invalid category id');
        error.statusCode = 400;
        throw error;
    }

    const result = await pool.query(
        `DELETE FROM categories WHERE id=$1 RETURNING *`,
        [categoryId]
    );

    if (result.rows.length === 0) {
        const error = new Error('Category not found');
        error.statusCode = 404;
        throw error;
    }
    return result.rows[0];
}

module.exports = {getAll,
    getById,
    createCategory,
    updateCategory,
    deleteCategory
};