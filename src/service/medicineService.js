const pool = require('../config/db');

const createServiceError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const getAll = async ()=>{
    const result = await pool.query(
        `SELECT medicines.*, categories.name AS category_name
        FROM medicines 
        JOIN categories ON medicines.category_id = categories.id`
    );
    return result.rows;
};

const getById = async (id)=>{
    const result = await pool.query(
        `SELECT medicines.*,
        categories.name AS category_name
        FROM medicines
        JOIN categories
        ON medicines.category_id =categories.id
        wHERE medicines.id = $1`,
        [id]
    );

    if (result.rows.length===0){
        const error = new Error('Medicine not found');
        error.statusCode=404;
        throw error;
    }

    return result.rows[0];
}

const createMedicine = async ({
    name,
    brand,
    category_id,
    unit,
    selling_price,
    prescription_required,
    is_active
}) => {
    // validate name 
    if (
        typeof name !== 'string' ||
        !name.trim() ||
        category_id === undefined ||
        category_id === null ||
        typeof unit !== 'string' ||
        !unit.trim() ||
        selling_price === undefined
    ) {
        throw createServiceError(
            'Name, category_id, unit and selling_price are required',
            400
        );
    }
    //validate categoty id
    const categoryId = Number(category_id);
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
        throw createServiceError('Invalid category id', 400);
    }
    //validate selling price
    if (
        typeof selling_price !== 'number' ||
        !Number.isFinite(selling_price) ||
        selling_price < 0
    ) {
        throw createServiceError('Invalid selling price', 400);
    }
    // validate prescription needed
    if (
        prescription_required !== undefined &&
        typeof prescription_required !== 'boolean'
    ) {
        throw createServiceError(
            'prescription_required must be a boolean',
            400
        );
    }
    // validate is_active
    if (is_active !== undefined && typeof is_active !== 'boolean') {
        throw createServiceError('is_active must be a boolean', 400);
    }
    // get the categories
    const categoryResult = await pool.query(
        'SELECT id, name FROM categories WHERE id = $1',
        [categoryId]
    );
    // validate the categoty
    if (categoryResult.rows.length === 0) {
        throw createServiceError('Category not found', 404);
    }
    //Inset query
    const result = await pool.query(
        `INSERT INTO medicines
        (name, brand, category_id, unit, selling_price, prescription_required, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
            name.trim(),
            brand || null,
            categoryId,
            unit.trim(),
            selling_price,
            prescription_required ?? false,
            is_active ?? true
        ]
    );

    return {
        ...result.rows[0],
        category_name: categoryResult.rows[0].name
    };
};

const updateMedicine = async ({
    name,
    brand,
    category_id,
    unit,
    selling_price,
    prescription_required,
    is_active,
    id
})=>{
    // validate medicine id
    if(!Number.isInteger(Number(id)) || Number(id)<=0){
        throw createServiceError('Invalid medicine id',400);
    }
    // check whether medecine exists
    const medicineResult = await pool.query(
        'SELECT * FROM medicines WHERE id = $1',
        [id]
    );
    if (medicineResult.rows.length === 0){
        throw createServiceError('Medicine not found',404);
    };
    // validate the required fields
    // validate name 
    if (
        typeof name !== 'string' ||
        !name.trim() ||
        category_id === undefined ||
        category_id === null ||
        typeof unit !== 'string' ||
        !unit.trim() ||
        selling_price === undefined
    ) {
        throw createServiceError(
            'Name, category_id, unit and selling_price are required',
            400
        );
    }
    //validate categoty id
    const categoryId = Number(category_id);
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
        throw createServiceError('Invalid category id', 400);
    }
    //validate selling price
    if (
        typeof selling_price !== 'number' ||
        !Number.isFinite(selling_price) ||
        selling_price < 0
    ) {
        throw createServiceError('Invalid selling price', 400);
    }
    // validate prescription needed
    if (
        prescription_required !== undefined &&
        typeof prescription_required !== 'boolean'
    ) {
        throw createServiceError(
            'prescription_required must be a boolean',
            400
        );
    }
    // validate is_active
    if (is_active !== undefined && typeof is_active !== 'boolean') {
        throw createServiceError('is_active must be a boolean', 400);
    }
    // get the categories
    const categoryResult = await pool.query(
        'SELECT id, name FROM categories WHERE id = $1',
        [categoryId]
    );
    // validate the categoty
    if (categoryResult.rows.length === 0) {
        throw createServiceError('Category not found', 404);
    }
    const result = await pool.query(
        `UPDATE medicines
        SET name = $1,
        brand = $2,
        category_id = $3,
        unit = $4,
        selling_price = $5,
        prescription_required = $6,
        is_active = $7
        WHERE id = $8
        RETURNING *`,
        [
        name.trim(),
        brand || null,
        Number(category_id),
        unit.trim(),
        selling_price,
        prescription_required ?? false,
        is_active ?? true,
        id
        ]
    );

    return {
        ...result.rows[0],
        category_name: categoryResult.rows[0].name
    };
};

const deleteMedicine = async (id)=>{
    if (!Number.isInteger(Number(id)) || Number(id) <= 0){
        throw createServiceError('Invalid medicine id',400) 
    }
    const result = await pool.query(
        'DELETE FROM medicines WHERE id = $1 RETURNING *',
        [id]
    );

    if (result.rows.length === 0){
        throw createServiceError('Medicine not found',404);
    }
    return result.rows[0];
};

module.exports = {getAll,
    getById,
    createMedicine,
    updateMedicine,
    deleteMedicine
};