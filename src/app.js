const express = require('express');
const categoryRoutes = require('./routes/categoryRoutes');
const medicineRoutes = require('./routes/medicineRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');


const app = express();

//Milddleware
app.use(express.json());

//Routes
app.use('/api/categories',categoryRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchases', purchaseRoutes);


//Rootendpoint
app.get('/',(req,res)=>{
    res.send('Express server is running');
})


module.exports = app;