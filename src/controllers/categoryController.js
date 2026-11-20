const pool = require ('../config/db');

const getCategories = async (req,res)=>{
    try{
        const result = await pool.query('Select *from categories');
        res.status(200).json(result.rows);
    }catch(error){
        console.error(error.message);
        res.status(500).json({
            message: 'Internal server error'
        });
        
    }
}

const getCategoryById = async (req,res)=>{
    try{
        const {id} = req.params;
        const result =await pool.query('select *from categories where id=$1',[id]);
        if(result.rows.length === 0){
            return res.status(404).json({
                message: 'category not found'
            });
        }
        res.status(200).json(result.rows[0]);
    }catch(error){
        console.error(error.message);
        res.status(500).json({
            message: 'Internal server error'
        })
    }
}

const createCategory = async(req,res)=>{
    try{
        const {name,description} = req.body;

        //validate category name 
        if(!name || name.trim()===''){
            return res.status(400).json({
                message:'categoty name is required'
            })
        }
        const result = await pool.query(
            `INSERT INTO categories (name,description) VALUES ($1,$2) RETURNING *`,
            [name.trim(),description || null]
        );
        res.status(201).json({
            message:'category created successfully',
            category: result.rows[0]
        });
    }catch(error){
        if(error.code === '23505'){
            return res.status(400).json({
                message:'category name already exists'
            });
        }
        console.log(error.message);

        res.status(500).json({
            message: 'Internal Server Error'
        })
    }
}

const updateCategory = async(req,res)=>{
    try{
        const {id} =req.params;
        const {name,description} = req.body;

        //validate category name
        if(!name || !name.trim()){
            return res.status(400).json({
                message: 'category name is required'
            });
        }

        const result = await pool.query(
            `UPDATE categories SET name=$1, description=$2 where id=$3 RETURNING *`,
            [name.trim(),description || null,id]
        );
        if (result.rows.length === 0){
            return res.status(404).json({
                message: 'category not found'
            });
        }

        res.status(200).json({
            message: 'category updated sucessfully',
            category: result.rows[0]
        });

    }catch(error){
        if(error.code === '23505'){
            return res.status(409).json({
                message : 'category name already exists'
            });
        }
        console.error(error.message);
        res.status(500).json({
            message: 'Internal server error'
        });
    }
}

const deleteCategory = async(req,res)=>{
    try{
        const {id}=req.params;
        
        const result = await pool.query(
            `DELETE FROM categories WHERE id=$1 RETURNING *`,
            [id]
        );
        if(result.rows.length === 0){
            return res.status(404).json({
                message: 'categotry not found'
            });
        }
        res.status(200).json({
            message:'category deleted successfully',
            category: result.rows[0]
        })
    }catch(error){
        if(error.code === '23503'){
            return res.status(400).json({
                message: 'cannot delete category with associated with medicines'
            })
        }
        console.error(error.message);
        res.status(500).json({
            message: 'Internal server error'
        });
    }
}

module.exports = {getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};
