
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    categoryName : { 
        type : String,
        required : true,
    },
    description : {
        type : String,
        default :  "Regular"
        // required : true,
    },
    isListed : {
        type : Boolean,
        required : true,
        default : true, 
    },
    offer : {
        type :  Boolean,
        required : true,
        default : false,
    }

});

module.exports = mongoose.model('Category',categorySchema);