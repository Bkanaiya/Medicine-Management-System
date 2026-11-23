const categoryService = require('../service/categoryService');

const getCategories = async (req, res) => {
    const result = await categoryService.getAll();
    res.status(200).json(result);
};

const getCategoryById = async (req, res) => {
    const { id } = req.params;
    const result = await categoryService.getById(id);

    res.status(200).json(result);
};

const createCategory = async (req, res) => {
    const category = await categoryService.createCategory(req.body);

    res.status(201).json({
        message: 'Category created successfully',
        category
    });
};

const updateCategory = async (req, res) => {
    const { id } = req.params;
    const category = await categoryService.updateCategory(id, req.body);

    res.status(200).json({
        message: 'Category updated successfully',
        category
    });
};

const deleteCategory = async (req, res) => {
    const { id } = req.params;
    const category = await categoryService.deleteCategory(id);

    res.status(200).json({
        message: 'Category deleted successfully',
        category
    });
};

module.exports = {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};