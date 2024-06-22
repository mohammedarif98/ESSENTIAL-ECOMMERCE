
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    productName : {
        type : String,
        required : true,
    },
    description : {
        type : String,
        required : true,
    },
    brandName : {
        type : String,
        required : true,
    },
    gender : {
        type : String,
        required : true,
    },
    price : {
        type : Number,
        required : true,
    },
    offerPrice : {
        type : Number,
    },
    offerType : {
        type : String,
        default:""
    },
    quantity : {
        type : Number,
        required : true,
        defualt : 0,
    }, 
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }, 
    size : {
        type : String,  
        required : true,
    },
    images : {
        type : Array,
        required : true,
    },
    color : {
        type : String,
        required : true
    },
    isListed: {
        type: Boolean,
        required: true,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    }

});


module.exports = mongoose.model('Product',productSchema);



