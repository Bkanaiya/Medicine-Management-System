const pool = require ('../config/db');

const getMedicines = async (req,res)=>{
    try{
        const result = await pool.query(
            'SELECT medicines.*, categories.name AS category_name FROM medicines JOIN categories ON medicines.category_id = categories.id'
        );
        res.status(200).json(result.rows);
    }catch(error){
        console.error(error.message);
        res.status(500).json({error: 'Internal Server Error'});
    }
}
const getMedicineById = async (req,res)=>{
    try{
        const {id} = req.params;
        const result = await pool.query(
            `SELECT medicines.*,
                categories.name AS category_name
            FROM medicines
            JOIN categories
            ON medicines.category_id =categories.id
            wHERE medicines.id = $1`,
            [id]
        );
        if (result.rows.length === 0){
            return res.status(404).json({error: 'Medicine not found'});
        }
        res.status(200).json(result.rows[0]);
    }catch(error){
        console.error(error.message);
        res.status(500).json({error: 'Internal Server Error'});
    }
}

const CreateMedicine =async (req,res)=>{
    try{
        const {
            name,
            brand,
            category_id,
            unit,
            selling_price,
            prescription_required,
            is_active
        }=req.body;

        //validate required fields
        if(!name || !name.trim() || !category_id || !unit || !selling_price === undefined){
            return res.status(400).json({message: 'Name, category_id, unit and selling_price are required'});
        }
        //validate category_id
        if(!Number.isInteger(Number(category_id)) || Number(category_id) < 0){
            return res.status(400).json({error: 'Invalid category id'});
        }
        //validate selling_price
        if(typeof selling_price !== 'number' || selling_price < 0){
            return res.status(400).json({error: 'Invalid selling price'});
        }
        //validate boolean fields
        if (
            prescription_required !== undefined &&
            typeof prescription_required !== 'boolean'
        ) {
            return res.status(400).json({
                message: 'prescription_required must be a boolean'
            });
        }

        if (
            is_active !== undefined &&
            typeof is_active !== 'boolean'
        ) {
            return res.status(400).json({
                message: 'is_active must be a boolean'
            });
        }
        //check whether the category exists
        const categoryResult = await pool.query(
            'SELECT id, name FROM categories WHERE id = $1',
            [category_id]
        );

        if (categoryResult.rows.length === 0) {
            return res.status(404).json({
                message: 'Category not found'
            });
        }
        // Insert medicine
        const result = await pool.query(
            `INSERT INTO medicines
                (name, brand, category_id, unit, selling_price, prescription_required, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [
                name.trim(),
                brand || null,
                category_id,
                unit.trim(),
                selling_price,
                prescription_required ?? false,
                is_active ?? true
            ]
        );

        res.status(201).json({
            message: 'Medicine created successfully',
            medicine: {
                ...result.rows[0],
                category_name: categoryResult.rows[0].name
            }
        });

    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const updateMedicine = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            name,
            brand,
            category_id,
            unit,
            selling_price,
            prescription_required,
            is_active
        } = req.body;

        // Validate medicine ID
        if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
            return res.status(400).json({
                message: 'Invalid medicine ID'
            });
        }

        // Check whether medicine exists
        const medicineResult = await pool.query(
            'SELECT * FROM medicines WHERE id = $1',
            [id]
        );

        if (medicineResult.rows.length === 0) {
            return res.status(404).json({
                message: 'Medicine not found'
            });
        }

        // Validate required fields
        if (
            !name ||
            !name.trim() ||
            !category_id ||
            !unit ||
            !unit.trim() ||
            selling_price === undefined
        ) {
            return res.status(400).json({
                message: 'Name, category_id, unit and selling_price are required'
            });
        }

        // Validate category ID
        if (!Number.isInteger(Number(category_id)) || Number(category_id) <= 0) {
            return res.status(400).json({
                message: 'Invalid category_id'
            });
        }

        // Validate selling price
        if (
            typeof selling_price !== 'number' ||
            !Number.isFinite(selling_price) ||
            selling_price < 0
        ) {
            return res.status(400).json({
                message: 'Selling price must be a non-negative number'
            });
        }

        // Validate boolean fields
        if (
            prescription_required !== undefined &&
            typeof prescription_required !== 'boolean'
        ) {
            return res.status(400).json({
                message: 'prescription_required must be a boolean'
            });
        }

        if (
            is_active !== undefined &&
            typeof is_active !== 'boolean'
        ) {
            return res.status(400).json({
                message: 'is_active must be a boolean'
            });
        }

        // Check whether category exists
        const categoryResult = await pool.query(
            'SELECT id, name FROM categories WHERE id = $1',
            [category_id]
        );

        if (categoryResult.rows.length === 0) {
            return res.status(404).json({
                message: 'Category not found'
            });
        }

        // Update medicine
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

        res.status(200).json({
            message: 'Medicine updated successfully',
            medicine: {
                ...result.rows[0],
                category_name: categoryResult.rows[0].name
            }
        });

    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const deleteMedicine = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate medicine ID
        if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
            return res.status(400).json({
                message: 'Invalid medicine ID'
            });
        }

        const result = await pool.query(
            'DELETE FROM medicines WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Medicine not found'
            });
        }

        res.status(200).json({
            message: 'Medicine deleted successfully',
            medicine: result.rows[0]
        });

    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: 'Internal server error'
        });
    }
};
 
module.exports = {getMedicines,
    getMedicineById,
    CreateMedicine,
    updateMedicine,
    deleteMedicine
};