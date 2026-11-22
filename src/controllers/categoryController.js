const pool = require('../config/db');
const categoryService = require ('../service/categoryService');

const getCategories = async (req,res)=>{
    try{
        const result = await categoryService.getAll();
        res.status(200).json(result);
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
        const result =await categoryService.getById(id);
        res.status(200).json(result);
    }catch(error){
        const statusCode = error.statusCode || 500;

        if (statusCode === 500) {
            console.error(error.message);
        }

        return res.status(statusCode).json({
            error: statusCode === 404
                ? error.message
                : 'Internal Server Error'
        });
    }
}

const createCategory = async(req,res)=>{
    try{
        const category = await categoryService.createCategory(req.body);
        return res.status(201).json({
            message: 'category created successfully',
            category
        });
    }catch(error){
        if(error.code === '23505'){
            return res.status(400).json({
                message:'category name already exists'
            });
        }

        const statusCode = error.statusCode || 500;
        if (statusCode === 500) {
            console.error(error.message);
        }

        return res.status(statusCode).json({
            message: statusCode === 500
                ? 'Internal Server Error'
                : error.message
        });
    }
}

const updateCategory = async(req,res)=>{
    try{
        const {id} =req.params;
        const category = await categoryService.updateCategory(id, req.body);

        return res.status(200).json({
            message: 'category updated successfully',
            category
        });

    }catch(error){
        if(error.code === '23505'){
            return res.status(409).json({
                message: 'category name already exists'
            });
        }

        const statusCode = error.statusCode || 500;
        if (statusCode === 500) {
            console.error(error.message);
        }

        return res.status(statusCode).json({
            message: statusCode === 500
                ? 'Internal server error'
                : error.message
        });
    }
}

const deleteCategory = async(req,res)=>{
    try{
        const {id}=req.params;
        
        const category = await categoryService.deleteCategory(id);
        return res.status(200).json({
            message: 'category deleted successfully',
            category
        });
    }catch(error){
        if(error.code === '23503'){
            return res.status(400).json({
                message: 'cannot delete category with associated with medicines'
            })
        }
        const statusCode = error.statusCode || 500;
        if (statusCode === 500) {
            console.error(error.message);
        }

        return res.status(statusCode).json({
            message: statusCode === 500
                ? 'Internal server error'
                : error.message
        });
    }
}

module.exports = {getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};
