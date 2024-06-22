
const User = require('../models/userModel');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Coupon = require('../models/couponModel');
const mongoose = require('mongoose')
const Razorpay = require('razorpay');
const dotenv = require('dotenv');
const crypto = require('crypto');
const moment = require('moment');
const easyInvoice = require('easyinvoice');
const { Readable } = require('stream');

//------------------- razorpay details
const instance = new Razorpay({
    key_id: process.env.Razorpay_key_id,
    key_secret: process.env.Razorpay_key_secret,
});
//--------------------


// ----------------------- cart quantity validation
const checkcart = async (req, res) => {
    try {
        const user = await User.findById(req.session.user_id).populate('cart.productId');
        const userCart = user.cart;
        const outOfStock = userCart.some(item => item.quantity > item.productId.quantity);

        if (outOfStock) {
            res.status(200).json({ outOfStock : true,message : "Product is out of stock" });
        }else{
            res.status(200).json({ outOfStock : false });
        }
    }catch(err){
        console.error(err);
    }
}

//------------------- function for render checkout page
const checkoutPage = async (req, res) => {
    try {
        const user = await User.findById(req.session.user_id).populate('cart.productId');
        const userCart = user;
        if(userCart.cart.length>0){
        const categories = await Category.find();
        const coupon = await Coupon.find();
        const walletResult = await User.aggregate([
            { $match: { _id: user._id } },
            { $unwind: "$wallet" },
            { $group: { _id: null, totalAmount: { $sum: "$wallet.amount" } } }
        ]);

        let walletBalance = "No wallet transactions found.";
        if (walletResult && walletResult.length > 0) {
            walletBalance = walletResult[0].totalAmount.toLocaleString("en-IN", {
                style: "currency",
                currency: "INR"
            });
            console.log("Total Amount in Wallet:", walletBalance);
        }

        res.render('checkoutPage', { user, userCart, categories, walletBalance, coupon });
    }else{
        res.redirect('/cartPage');
    }
    } catch (error) {
        console.log("Error in loading checkout page", error);
        res.status(500).send("Internal Server Error");
    }
};


//----------------------- function for order payments [razorpay,COD,wallet]
const orderPayment = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const user = await User.findById(req.session.user_id);
        const cart = await User.findById(req.session.user_id, { cart: 1, _id: 0 });

        const coupon = await Coupon.findOne({
            $and: [
              { couponCode: req.body.code },
              { users: { $nin: [req.session.user_id] } },
            ],
          });

        const wallet = await User.aggregate([
            { $match: { _id: user._id } },
            { $unwind: "$wallet" },
            {
                $group: { _id: null, totalAmount: { $sum: "$wallet.amount" } }
            }]).exec();

        let walletBalance;

        if (wallet && wallet.length > 0) {
            walletBalance = wallet[0].totalAmount.toLocaleString('en-IN', {
                style: 'currency',
                currency: "INR"
            });
        } else {
            console.log("No wallet transactions found.");
        }

        req.session.return = '/orderPayment';

        let discount = coupon.discount;
        let newTotal = req.body.total
        let totalP = 0;
        let discountedAmt = 0;

        
        if (req.body.code) {
            console.log("coupon present",req.body.code);
            if ( parseInt(req.body.total)  >  parseInt(coupon.minPrice) ) {
                discountedAmt = req.body.total - coupon.discount;
            }else{
                console.log("coupon price grarter");
            }
            newTotal = req.body.total - discount;
        } else if ( !req.body.code ) {
            console.log("no coupon used");
        }
    
        totalP = newTotal ? newTotal : req.body.total;

        if( req.body.payment_option === "COD" && totalP > 1000 ){
           return  res.status(200).json({ status : false, msg : "COD not allowed above 1000 ₹" }); 
        }else{
            // Create a new order
            const order = new Order({
                userId: userId,
                quantity: req.body.quantity,
                price: req.body.price,
                products: cart.cart,
                coupon: req.body.code,
                discount: discount,
                amountPaided : newTotal,
                totalAmount: req.body.total,
                shippingAddress: JSON.parse(req.body.address),
                paymentDetails: req.body.payment_option,
            });

            const orderSuccess = await order.save();
            const orderId = order._id;

            if (orderSuccess) {
                // Make the cart empty
                await User.updateOne({ _id: userId }, { $unset: { cart: 1 } });

                // Check if COD is selected as the payment option
                if (req.body.payment_option === "COD") {
                    await Order.updateOne(
                        { _id: new mongoose.Types.ObjectId(orderId) },
                        { $set: { orderStatus: 'ORDER CONFIRMED' } }
                    );
                    // Update product quantities
                    for (const cartItem of user.cart) {
                        const product = await Product.findById(cartItem.productId);
                        if (product) {
                            product.quantity -= cartItem.quantity;
                            await product.save();
                        }
                    }

                    res.status(200).json({ status: true, msg: "Order created for COD", orderId: orderId });

                } else if (req.body.payment_option === 'RAZORPAY') {

                    const amount = totalP * 100;
                    const options = {
                        amount: amount,
                        currency: 'INR',
                        receipt: String(orderId),
                    };

                    for (const cartItem of user.cart) {
                        const product = await Product.findById(cartItem.productId);
                        if (product) {
                            product.quantity -= cartItem.quantity;
                            await product.save();
                        }
                    }

                    //  razorpay order creation
                    instance.orders.create(options, (err, order) => {
                        if (!err) {
                            res.status(200).send({
                                success: true,
                                msg: "Order Created",
                                order_id: order.id,
                                amount: amount,
                                receipt: orderId,
                                key_id: process.env.Razorpay_key_id,
                                // contact : user.phone,
                                name: 'ESSENTIAL',
                                contact: '7012157539',
                                // name : user.username,
                                email: 'arifcs532@gmail.com',
                                orderId: orderId
                            });
                        } else {
                            console.error("Razorpay order creation failed:", err);
                            res.status(400).send({ success: false, msg: "Something went wrong!", orderId: orderId });
                        }
                    });
                } else if (req.body.payment_option === 'WALLET') {
                    if (wallet[0].totalAmount < order.totalAmount) {
                        res.status(200).json({ lowWalletBalance: true, message: 'Bill Amount Exceed Wallet Balance', })
                    } else {
                        let transaction = {
                            orderId: orderId,
                            amount: -order.totalAmount,
                            transactionType: "DEBIT",
                            remark: "ORDER CONFIRMED",
                        };
                        user.wallet.push(transaction);
                        await user.save();

                        await Order.updateOne(
                            { _id: new mongoose.Types.ObjectId(orderId) },
                            { $set: { orderStatus: "ORDER CONFIRMED", paymentStatus: "PAYMENT RECEIVED" } }
                        );

                        for (const cartItem of user.cart) {
                            const product = await Product.findById(cartItem.productId);

                            if (product) {
                                product.quantity -= cartItem.quantity;
                                await product.save();
                            }
                        }
                        res.status(200).json({ status: true, msg: 'Order Created Using Wallet', orderId: orderId })
                    }
                }
            } else {
                // Handle other payment options here
                console.log("Invalid payment option");
                res.status(400).json({ error: "Invalid payment option" });
            }
        }
    } catch (error) {
        console.log('error found in payment', error)
        res.status(500).send("Internal Server Error");
    }
}


// -------------------- razorpay payment varification
const verifyPayment = async (req, res) => {
    try {
        const orderDetail = await Order.find({ _id: req.body.orderId });
        let hmac = crypto.createHmac('sha256', 'rzp_test_w7RdYb47Ojxm3a');
        hmac.update(req.body.payment.razorpay_order_id + '|' + req.body.payment.razorpay_payment_id);
        hmac = hmac.digest('hex');

        if (hmac) {
            await Order.updateOne(
                { _id: new mongoose.Types.ObjectId(req.body.orderId) },
                { $set: { paymentStatus: 'PAYMENT RECEIVED', orderStatus: "ORDER CONFIRMED" } }
            );

            res.status(200).json({ status: 'success', msg: 'Payment verified', orderId: req.body.orderId });
        } else {
            res.status(400).json({ status: 'error', msg: 'Payment verification failed' });
        }

    } catch (error) {
        console.log('error found in razorpay payment varifiacation')
        res.status(500).json({ status: 'error', msg: 'Internal server error' });
    }
}


// --------------- function for display order list in user side
const orderList = async (req, res) => {
    try {
        const user = await User.findById(req.session.user_id);
        const orderId = req.query.order_id;

        // const orders = await Order.find({ userId: req.session.user_id }).populate('products.productId');

        const orderInvoice = await Order.findOne({ _id: orderId }).populate('products.productId');

        const { page = 1, limit = 4 } = req.query;
        const currentPage = parseInt(page);
        const skip = (currentPage - 1) * limit;
        const orderPagnation = await Order.find({ userId: req.session.user_id }).limit(+limit).skip(skip).populate('products.productId').sort({ createdAt: -1 });
        const count = await Order.countDocuments();
        totalPages = Math.ceil(count / limit);

        res.render('orderListPage', { user, orders: orderPagnation, totalPages, currentPage, limit,orderInvoice });
    } catch (error) {
        console.log("Error in orderList:", error);
        res.status(404).render('error', { message: "Product not found" });
    }
}


// --------------- ordered product details page
const orderDetails = async (req, res) => {
    try {
        const orderId = req.query.order_id;
        const productId = req.query.productId;
        const user = await User.findById(req.session.user_id);
        const order = await Order.findOne({ _id: orderId }).populate('products.productId');

        const selectedProduct = order.products.filter(product => product.productId._id.toString() === productId);
        // show related products from the same order
        const relatedOrderProducts = order.products.filter(product => product.productId._id.toString() !== productId);

        res.render('orderDetailPage', { user, order, orderProduct: selectedProduct, relatedOrderProducts, orderId });
    } catch (error) {
        console.log("Error in orderDetails:", error);
        res.status(500).render('500ErrorPage', { message: error.message });
    }
}

//-------------------------- genarating invoice
const downloadInvoice = async (req, res) => {
    try {
        const orderId = req.query.order_id;
        const [user, order] = await Promise.all([
            User.findById(req.session.user_id),
            Order.findOne({ _id: orderId }).populate('products.productId')
        ]);

        if (!order) {
            return res.status(404).send("Order not found");
        }

        const orderDetails = {
            id: orderId,
            totalAmount: order.totalAmount,
            amountPaid: order.amountPaided, // Using amountPaided as specified
            discount: order.discount,
            orderDate: order.createdAt,
            orderStatus: order.orderStatus,
            products: order.products,
            paymentDetails: order.paymentDetails,
            fullName: order.shippingAddress.fullName,
            email: order.shippingAddress.email,
            number: order.shippingAddress.phone,
            address1: order.shippingAddress.addressLine1,
            addressType: order.shippingAddress.addressType,
            pinCode: order.shippingAddress.pinCode,
            city: order.shippingAddress.city,
            state: order.shippingAddress.state
        };

        // Filter the products to include only those with productOrderStatus === "PRODUCT DELIVERED"
        const deliveredProducts = (orderDetails.products || []).filter(productObj => productObj.productOrderStatus === "PRODUCT DELIVERED");
        // console.log("----------->",deliveredProducts);

        const productDetails = deliveredProducts.map(productObj => {
            const product = productObj.productId;
            const price = product.offerPrice || product.price;
            return {
                description: product.productName,
                quantity: parseInt(productObj.quantity),
                price: parseInt(price),
                total: parseFloat(productObj.amountPaid),
                "tax-rate": 0,
            };
        });

        const isoDateString = orderDetails.orderDate;
        const isoDate = new Date(isoDateString);
        const options = { year: "numeric", month: "long", day: "numeric" };
        const formattedDate = isoDate.toLocaleDateString("en-US", options);

        // Generate a random invoice number
        const generateInvoiceNumber = () => {
            return Math.floor(Math.random() * 9000000000000000000) + 1000000000000000000;
        };
        const invoiceNumber = generateInvoiceNumber();

        const data = {
            customize: {},
            images: {
                logo: "",
            },
            sender: {
                company: "ESSENTIAL",
                address: "First Floor Forum Mall Kochi",
                city: "Ernakulam",
                country: "India",
            },
            client: {
                company: order.shippingAddress?.fullName,
                zip: orderDetails.pinCode,
                city: orderDetails.city,
                address: orderDetails.address1,
            },
            information: {
                number: `${invoiceNumber}`,
                date: formattedDate,
            },
            products: productDetails,
            "bottom-notice": "Happy shopping and visit essential store again",
        };

        let pdfResult = await easyInvoice.createInvoice(data);
        const pdfBuffer = Buffer.from(pdfResult.pdf, "base64");

        res.setHeader("Content-Disposition", 'attachment; filename="invoice.pdf"');
        res.setHeader("Content-Type", "application/pdf");

        const pdfStream = new Readable();
        pdfStream.push(pdfBuffer);
        pdfStream.push(null);

        pdfStream.pipe(res);

    } catch (error) {
        console.log("error occur in invoice creating", error);
        res.status(500).send("internal server error");
    }
};

 
//------------------ function for group of order cancelation
const cancelOrder = async (req, res) => {
    try {
        const orderId = req.query.order_id;
        const order = await Order.findById(orderId);
        const user = await User.findById(req.session.user_id);

        if (order.paymentDetails === 'COD' || order.paymentDetails === 'RAZORPAY' || order.paymentDetails === 'WALLET') {
            const updateOptions = {
                orderStatus: "ORDER CANCELLED",
                paymentStatus: "PAYMENT REFUNDED"
            };
            if (order.paymentStatus === "PAYMENT RECEIVED") {
                for (const orderItem of order.products) {
                    const product = await Product.findById(orderItem.productId);
                    if (product) {
                        product.quantity += orderItem.quantity;
                        await product.save();
                    }
                }
                const walletUpdate = {
                    orderId: order._id,
                    amount: order.totalAmount,
                    transactionType: "CREDIT",
                    remark: "ORDER CANCELLED"
                };
                user.wallet.push(walletUpdate);
                await user.save();
            }
            await Order.findByIdAndUpdate(orderId, updateOptions);
        }
        res.json({ success: true, message: 'Cancel order Successfully' });
        // res.redirect("/orderList");
    } catch (error) {
        console.log("error occur in order cancellation", error);
        res.status(404).render('error', { message: "product not found" });
    }
};

// --------------------- function for group of order returning
const returnOrder = async (req, res) => {
    try {
        const orderId = req.query.order_id;

        const order = await Order.findById({ _id: new mongoose.Types.ObjectId(orderId) });
        const user = await User.findById(req.session.user_id);
        await Order.findByIdAndUpdate({ _id: new mongoose.Types.ObjectId(orderId) },
            { $set: { orderStatus: "ORDER RETURNED", paymentStatus: "PAYMENT REFUNDED" } }
        ).lean();

        if (order) {
            for (const orderItem of order.products) {
                const product = await Product.findById(orderItem.productId);

                if (product) {
                    product.quantity += orderItem.quantity;
                    await product.save();
                }
            }
            const walletUpdate = {
                orderId: order._id,
                amount: order.totalAmount,
                transactionType: "CREDIT",
                remark: "ORDER RETURNED"
            };
            // user.wallet.push(walletUpdate);
            await user.save();

        }

        res.json({ success: true, message: "Return order successfull" })
        // res.redirect("/userProfile");
    } catch (error) {
        console.error(error.message);
        res.status(404).render('error', { message: error.message });
    }
};

//------------------ function for cancel a single product from order
const productCancelRequest = async (req, res) => {
    try {
        const { reason, productId, orderId } = req.body;
        const updatedOrder = await Order.findOneAndUpdate(
            { _id: orderId, "products.productId": productId },
            { $set: { "products.$.reason": reason, "products.$.productOrderStatus": "CANCELATION REQUESTED" } },
            { new: true }
        );
        res.redirect("/orderList");
    } catch (error) {
        console.log("Error occurred in product cancellation", error);
        res.status(404).render('error', { message: "Product not found for canceling" });
    }
}

//----------------------- function for return a single product from order
const productReturnRequest = async (req, res) => {
    try {
        const { returnReason, productId, orderId } = req.body;
        await Order.findOneAndUpdate(
            { _id: orderId, "products.productId": productId },
            { $set: { "products.$.reason": returnReason, "products.$.productOrderStatus": "RETURN REQUESTED" } },
            { new: true }
        );
        res.redirect("/orderList");
    } catch (error) {
        console.log('Error occurred in product returning', error);
        res.status(404).render('error', { message: 'product not found for returning' })
    }
}

// ------------------------- adding money to wallet 
const addMoney = async (req, res) => {

}




module.exports = {
    checkcart,
    checkoutPage,
    orderPayment,
    verifyPayment,
    orderList,
    orderDetails,
    downloadInvoice,
    cancelOrder,
    productCancelRequest,
    productReturnRequest,
    returnOrder,
};