const medicineService = require('../service/medicineService');

const getMedicines = async (req, res) => {
    const medicines = await medicineService.getAll();
    res.status(200).json(medicines);
};

const getMedicineById = async (req, res) => {
    const { id } = req.params;
    const medicine = await medicineService.getById(id);

    res.status(200).json(medicine);
};

const CreateMedicine = async (req, res) => {
    const medicine = await medicineService.createMedicine(req.body);

    res.status(201).json({
        message: 'Medicine created successfully',
        medicine
    });
};

const updateMedicine = async (req, res) => {
    const { id } = req.params;
    const medicine = await medicineService.updateMedicine({
        ...req.body,
        id
    });

    res.status(200).json({
        message: 'Medicine updated successfully',
        medicine
    });
};

const deleteMedicine = async (req, res) => {
    const { id } = req.params;
    const medicine = await medicineService.deleteMedicine(id);

    res.status(200).json({
        message: 'Medicine deleted successfully',
        medicine
    });
};

module.exports = {
    getMedicines,
    getMedicineById,
    CreateMedicine,
    updateMedicine,
    deleteMedicine
};