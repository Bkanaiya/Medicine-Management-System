const express = require('express');
const router = express.Router();

const {getMedicines,
    getMedicineById,
    CreateMedicine,
    updateMedicine,
    deleteMedicine
} = require('../controllers/medicineController');

router.get('/', getMedicines);
router.get('/:id', getMedicineById);
router.post('/', CreateMedicine);
router.put('/:id',updateMedicine);
router.delete('/:id', deleteMedicine);

module.exports = router;