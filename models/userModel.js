
const mongoose = require('mongoose');
const moment = require('moment-timezone');


// ------------ address Schema

const addressSchema = new mongoose.Schema({
    fullName : {
        type : String,
        required : true
    },
    addressLine1 : {
        type : String,
    },
    addressLine2 : {
        type : String, 
    },
    email : {
        type : String,
        required : true
    },
    phone : {
        type : Number,
        required : true
    },
    city : {
        type : String,
        required : true
    },
    state : {
        type : String, 
        required : true
    },
    country : {
        type : String,
        required : true
    },
    pinCode : {
        type : Number,
        required : true
    },
    addressType : {
        type : String,
        default : "Home"
    },
    main : {
        type : Boolean,
        default : false
    }
})

// ------------ user schema
const userSchema = new mongoose.Schema({
    
    username : {
        type : String,
        required : true
    },
    email : { 
        type : String,
        required : true
    },
    phone : {
        type : Number,
        required : true
    },
    image :{
        type : String,
        required : false
    },
    password : {
        type : String,
        required : true
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    isBlocked:{
        type: Boolean,
        default : false,
    },
    isActive:{
        type: Boolean,
        default : true
    },
    cart : [{ productId : {type : mongoose.Schema.Types.ObjectId,ref : 'Product'},quantity : Number}],
    address : [addressSchema],
    wishlist : [{ productId : {type : mongoose.Schema.Types.ObjectId,ref : 'Product'}}],
    wallet : [{ 
        orderId : {type : mongoose.Schema.Types.ObjectId,ref : 'order'},
        transactionType : String,
        amount : Number,
        remark : String,
        createdOn : {type: Date,default: () => moment.tz(Date.now(), "Asia/Kolkata")},
    }],

})
 
const Userdb =  mongoose.model('user',userSchema)
module.exports = Userdb;