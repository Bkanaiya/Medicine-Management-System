const medicineService = require('../service/medicineService');

const getMedicines = async (req,res)=>{
    try{
        const medicines = await medicineService.getAll();
        res.status(200).json(medicines);
    }catch(error){
        console.error(error.message);
        res.status(500).json({error: 'Internal Server Error'});
    }
}
const getMedicineById = async (req,res)=>{
    try{
        const {id} = req.params;
        const medicineById = await medicineService.getById(id);
        
        res.status(200).json(medicineById);
    } catch (error) {
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

const CreateMedicine =async (req,res)=>{
    try{
        const medicine = await medicineService.createMedicine(req.body);

        return res.status(201).json({
            message: 'Medicine created successfully',
            medicine
        });

    } catch (error) {
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
};

const updateMedicine = async (req, res) => {
    try {
        const { id } = req.params;
        const medicine = await medicineService.updateMedicine({
            ...req.body,
            id
        });

        return res.status(200).json({
            message: 'Medicine updated successfully',
            medicine
        });

    } catch (error) {
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
};

const deleteMedicine = async (req, res) => {
    try {
        const { id } = req.params;

        const medicine = await medicineService.deleteMedicine(id);

        return res.status(200).json({
            message: 'Medicine deleted successfully',
            medicine
        });

    } catch (error) {
        const statusCode= error.statusCode || 500;
        if (statusCode === 500) {
            console.error(error.message);
        }

        return res.status(statusCode).json({
            message: statusCode === 500
                ? 'Internal server error'
                : error.message
        });
    }
};
 
module.exports = {getMedicines,
    getMedicineById,
    CreateMedicine,
    updateMedicine,
    deleteMedicine
};