const express = require('express');
const categoryRoutes = require('./routes/categoryRoutes');
const medicineRoutes = require('./routes/medicineRoutes');

const app = express();

//Milddleware
app.use(express.json());

//Routes
app.use('/api/categories',categoryRoutes);
app.use('/api/medicines', medicineRoutes);


//Rootendpoint
app.get('/',(req,res)=>{
    res.send('Express server is running');
})


module.exports = app;