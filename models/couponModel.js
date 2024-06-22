
const mongoose = require('mongoose');
const moment = require('moment-timezone');

const couponSchema = new mongoose.Schema({

    couponCode: {
        type: String,
        required: true,
        unique : true,
        upperCase : true
    },
    discount: {
        type: Number,
        required: true
    },
    minPrice: {
        type: Number,
        required: true
    },
    maxDiscount: {
        type: Number,
        required: false,
        defualt : 0,
    },
    expiry: {
        type: Date,
        required : true
    },
    createdAt: {
        type: Date,
        default: () => moment.tz("Asia/Kolkata").toDate()
    },
    users: {
        type: Array,
        userId: {
            type: String
        }
    },
    isListed: {
        type: Boolean,
        default : true
    },

}) 


module.exports = mongoose.model('Coupon',couponSchema);