
const mongoose = require('mongoose');

// ------------ admin model
const adminSchema = new mongoose.Schema({
    name:{
        type : String,
        required : true
    },
    phone : {
        type : Number,
        required : true
    },
    email : {
        type : String,
        required : true
    },
    password : {
        type : String,
        required : true
    }
});

const Admindb = mongoose.model('admin',adminSchema);
module.exports = Admindb;