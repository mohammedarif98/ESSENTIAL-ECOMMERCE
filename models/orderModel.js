
const mongoose = require('mongoose');
const moment = require('moment-timezone');


const orderSchema = new mongoose.Schema({
    
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    products: [{
        productId: {
            type : mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        productPaymentStatus : {
            type : String, 
        },
        productOrderStatus: {
            type : String,
            default: "ORDER PENDING",
        },
        reason : String,
        quantity: Number,
        price: Number,
    }],

    paymentMethod :{
        type: String
    },
    paymentStatus: {
        type : String,
        default: "PENDING"
    },
    paymentDetails:{
        type: Object,
        default : 'COD'
    },
    shippingMethod: {
        type : String,
        default: "Standard-Shipping"
    },
    shippingCost: {
        type : Number,
        default: 0
    },
    totalItems: {
       type : Number,
    },
    totalAmount: {
        type : Number
    },   
    discount: {
		type: Number,
		default: 0,
	},
    amountPaided : {
        type : Number,
        default : 0,
    },
    coupon: {
        type: String,
        default: 'no coupon'
    },
    shippingAddress : {},
    orderStatus: {
        type : String,
        default: "ORDER CONFIRMED"
    },
    createdAt: {
        type: Date,
        default: () => moment.tz("Asia/Kolkata").toDate()
    },
    updatedAt:{
        type: Date,
        default: () => moment.tz("Asia/Kolkata").toDate()
    },
    deliveredOn:{
        type: Date
    },

}); 




// module.exports =  mongoose.model('Order',orderSchema);
const orderdb =  mongoose.model('order',orderSchema)
module.exports = orderdb;