
const Admin = require('../models/adminModel');
const User = require('../models/userModel');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const bcrypt = require('bcrypt');
const PDFDocument = require('pdfkit');
const xlsx = require('xlsx');
const ExcelJS = require('exceljs');
const { DateTime } = require('luxon');




// ------------ controller func for home page
const adminHome = async (req, res) => {
    try {
        const user = await User.countDocuments();
        const product = await Product.countDocuments();
        const category = await Category.countDocuments();
        const order = await Order.countDocuments();
        const prouctDetails = await Product.find()
        
        const revenue = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$totalAmount" }
                }
            }
        ]);

        const totalRevenue = revenue[0].totalAmount.toLocaleString("en-IN");
      
        const orderDiscount = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    totalDiscount: { $sum: "$discount" }
                }
            }
        ]);

        const totalDiscount = orderDiscount[0].totalDiscount;

        const productCountData = await Product.aggregate([
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 },
                },
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "_id",
                    foreignField: "_id",
                    as: "categoryData",
                },
            },
            {
                $addFields: {
                    categoryName: { $arrayElemAt: ["$categoryData.categoryName", 0] },
                },
            },
        ]);

        const categoryNames = productCountData.map((item) => item.categoryName);
        const categoryCounts = productCountData.map((item) => item.count);

        //*---------------- top selling product
        const topSellingProduct = await Order.aggregate([
            { $unwind: "$products" }, // Unwind the products array
            {
                $group: {
                    _id: "$products.productId", // Group by productId
                    totalQuantitySold: { $sum: "$products.quantity" } // Sum the quantities
                }
            },
            {
                $lookup: {
                    from: "products", // Name of the products collection
                    localField: "_id",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            { $unwind: "$productDetails" }, // Unwind the product details array
            {
                $project: {
                    productName: "$productDetails.productName",
                    productImage: "$productDetails.images", 
                    totalQuantitySold: 1
                }
            },
            { $sort: { totalQuantitySold: -1 } },
            { $limit: 6 } 
        ]);

        //*---------------- top selling brand
        const topSellingBrand = await Order.aggregate([
            { $unwind: "$products" }, 
            {
                $group: {
                _id: "$products.productId", 
                totalQuantitySold: { $sum: "$products.quantity" } 
                }
            },
            {
                $lookup: {
                from: "products", 
                localField: "_id",
                foreignField: "_id",
                as: "productDetails"
                }
            },
            { $unwind: "$productDetails" }, 
            {
                $group: {
                _id: "$productDetails.brandName", 
                totalQuantitySold: { $sum: "$totalQuantitySold" } 
                }
            },
            {
                $project: {
                brandName: "$_id", 
                totalQuantitySold: 1
                }
            },
            { $sort: { totalQuantitySold: -1 } }, 
            { $limit: 6 } 
        ]);

        //*---------------- top selling category
        const topSellingCategory = await Order.aggregate([
                { $unwind: "$products" }, // Unwind the products array
                {
                $group: {
                    _id: "$products.productId", // Group by productId
                    totalQuantitySold: { $sum: "$products.quantity" } // Sum the quantities
                }
                },
                {
                $lookup: {
                    from: "products", // Name of the products collection
                    localField: "_id",
                    foreignField: "_id",
                    as: "productDetails"
                }
                },
                { $unwind: "$productDetails" }, // Unwind the product details array
                {
                $lookup: {
                    from: "categories", // Name of the categories collection
                    localField: "productDetails.category", // Assuming category field is the reference in products collection
                    foreignField: "_id",
                    as: "categoryDetails"
                }
                },
                { $unwind: "$categoryDetails" }, // Unwind the category details array
                {
                $group: {
                    _id: "$categoryDetails.categoryName", // Group by category name
                    totalQuantitySold: { $sum: "$totalQuantitySold" } // Sum the quantities for each category
                }
                },
                {
                $project: {
                    categoryName: "$_id", // Use the category name as the field name
                    totalQuantitySold: 1
                }
                },
                { $sort: { totalQuantitySold: -1 } }, // Sort by totalQuantitySold in descending order
                { $limit: 6 }
        ]);

        //*------------------ monthly sales for graph
        const monthlySales = await Order.aggregate([
            {
              $project: {
                year: { $year: "$createdAt" },
                month: { $month: "$createdAt" },
              },
            },
            {
              $group: {
                _id: { year: "$year", month: "$month" },
                totalOrders: { $sum: 1 },
              },
            },
            {
              $sort: {
                "_id.year": 1,
                "_id.month": 1,
              },
            },
          ]);
        const monthlyProduct = await Product.aggregate([
            {
                $project: {
                  year: { $year: "$createdAt" },
                  month: { $month: "$createdAt" },
                },
              },
              {
                $group: {
                  _id: { year: "$year", month: "$month" },
                  totalProducts: { $sum: 1 },
                },
              },
              {
                $sort: {
                  "_id.year": 1,
                  "_id.month": 1,
                },
              },
        ]);

        //*---------------- graph-----------
        const graphDataSales = [];
        const graphDataProdcut = [];
        // Looping sales through the 12 months (1 to 12)
        for (let month = 1; month <= 12; month++) {
            const resultForMonth = monthlySales.find(
                (result) => result._id.month === month
            );
            if (resultForMonth) {
                graphDataSales.push(resultForMonth.totalOrders);
            } else {
                graphDataSales.push(0);
            }
        }
        // looping product through 1-12 month
        for(let month =1;month<=12;month++){
            const resMonth = monthlyProduct.find(
                (resMonth)=>resMonth._id.month === month
            );
            if (resMonth) {
                graphDataProdcut.push(resMonth.totalProducts);
            } else {
                graphDataProdcut.push(0);
            }
        }

        //* ------------------ custom sales report --------------------
        // const { startDate,endDate } = req.query;

        // const start = new Date(startDate);
        // const end = new Date(endDate);

        // const customOrderDate = await Order.find({createdAt:{$gte:start,$lte:end}})
        // console.log(customOrderDate);

        res.render('adminPage', { user, product, category, order, totalRevenue, totalDiscount, categoryNames, categoryCounts, prouctDetails, topSellingProduct, topSellingBrand, topSellingCategory, graphDataSales, graphDataProdcut, });
    } catch (error) {
        console.log('Error loading:', error);
        res.status(500).send('Internal Server Error');
    }
};


// ------------ controller func for admin Login page
const adminLoginpage = async(req,res)=>{
    try{
        res.render('adminLogin')
    }catch(error){
        console.log('Error loading:', error);
        res.status(500).send('Internal Server Error'); 
    }
}

// -------------- controller func for admin login 
const adminLogin = async(req,res)=>{
    try {
        console.log(req.body);
        const email =  req.body.email;
        if(req.body.email != null && req.body.password != null){
            const adminDetails = await Admin.findOne({email : email});
            if(adminDetails){
                const passwordMatch = await bcrypt.compare(
                    req.body.password,
                    adminDetails.password
                );
                if(passwordMatch){
                    req.session.admin = adminDetails._id;
                    res.redirect('/admin/adminhome')
                }else{
                    res.redirect('/admin/') 
                }
            }
        }
    }catch(error){
        console.log(error)
    }
}

// ------------------- controller func for admin logout 
const adminLogout = async(req,res)=>{
    try{
        await req.session.destroy();
        res.redirect("/admin/");
    }catch(error){
        console.error('Error in adminLogout:',error);
        res.status(500).send('Internal Server Error');
    }
};

//* ------------------------ user details -----------------------

// ------------------- controller func for user detail list in admin dashbord
const listUserPage = async(req,res)=>{
    try{
        const {page = 1,limit = 10} = req.query;
        const currentPage = parseInt(page); // Convert page to a number
        const skip = (currentPage-1)*limit; 
        const users = await User.find().limit(+limit).skip(skip); 
        const count = await User.countDocuments();
        totalPages = Math.ceil(count / limit)
        res.render('listUsers',{users:users,totalPages,currentPage});
    }catch(error){
        console.error('Error in ListUser Page:', error);
        res.status(500).send('Internal Server Error');
    }
};

//----------------------  controller func for change the status of user 
const userStatusChange = async(req,res)=>{
    try{
        const userid = req.body.userid;
        console.log(userid);
        const user = await User.findById({_id:userid});
        if(user.isActive){  
            await User.findByIdAndUpdate(userid,{isActive:false});
            res.status(200).json({blocked : true})
        }else{
            await User.findByIdAndUpdate(userid,{isActive:true});
            res.status(200).json({unblocked : true})
        } 
    }catch(error){
        console.log(error);
    }
}

//* ------------------------ order details -----------------------

//-------------------- controller for order management 
const orderManagement = async(req,res)=>{
    try{
        const {page = 1,limit = 10} = req.query;
        const currentPage = parseInt(page); // Convert page to a number
        const skip = (currentPage-1)*limit; 
        const orders = await Order.find().limit(+limit).skip(skip).populate('userId').sort({createdAt:-1}); 
        const count = await Order.countDocuments();
        totalPages = Math.ceil(count / limit)
        res.render('listOrder',{order:orders,totalPages,currentPage,limit});
    }catch(error){
        console.log("error in loading order mangment details",error);
        res.status(500).send('Internal Server Error');
    }
}

// ----------------------- order details
const orderDetail = async (req, res) => {
    try {
        const orderId = req.query.order_id;
        const order = await Order.findById(orderId).populate('userId').populate('products.productId');
        res.render('oderDetail', { order });
    } catch (error) {
        console.log('error in loading order details in admin', error); 
        res.status(404).send('Internal Server Error');
    }
}

// -------------------- order status changing
const orderStatus = async (req, res) => {
    try {

        const { order_id } = req.query;
        const { status } = req.body;
        const update = { orderStatus: "ORDER CANCELLED" };

        const order = await Order.findById(order_id);
        await Order.findByIdAndUpdate(order_id,update);

        if(status === "ORDER DELIVERED"){
            if(order.paymentDetails === "COD"){
                await Order.findByIdAndUpdate({ _id:order_id },{ paymentStatus: "PAYMENT RECEIVED", orderStatus: "ORDER DELIVERED" });
            }else if (order.paymentDetails === "RAZORPAY"){
                await Order.findByIdAndUpdate({ _id:order_id },{ orderStatus: "ORDER DELIVERED" });
            }else if (order.paymentDetails === 'WALLET'){
                await Order.findByIdAndUpdate({ _id:order_id },{ orderStatus: "ORDER DELIVERED" });
            }
        }else if(status === "ORDER DISPATCHED"){
            if(order.paymentDetails === "COD"){
                await Order.findByIdAndUpdate({ _id:order_id },{ orderStatus: "ORDER DISPATCHED" });
            }else if(order.paymentDetails === "RAZORPAY"){
                await Order.findByIdAndUpdate({ _id:order_id },{ orderStatus: "ORDER DISPATCHED" });   
            }else if(order.paymentDetails === "WALLET"){
                await Order.findByIdAndUpdate({ _id:order_id },{ orderStatus: "ORDER DISPATCHED" });
            }
        }else if(status === 'ORDER CANCELLED'){
            // if(order){
            //     for(const orderItem of order.products){
            //         const product = await Product.findById(orderItem.productId);
            //         product ? (product.quantity += orderItem.quantity,await product.save(),console.log("quantity increased")) : null;
            //     }
            //     const user = await User.findById(req.session.user_id);
            //     user ? await user.save() : console.log('User not found');
            
            // }      
            if(order.paymentDetails === "COD"){
                await Order.findByIdAndUpdate({ _id:order_id },{ orderStatus:"ORDER CANCELLED" });
            }else if(order.paymentDetails === "RAZORPAY"){
                await Order.findByIdAndUpdate({ _id:order_id },{ paymentStatus: "PAYMENT REFUNDED",orderStatus:"ORDER CANCELLED" });
            }else if(order.paymentDetails === 'WALLET'){
                await Order.findByIdAndUpdate({_id:order_id},{orderStatus:"PAYMENT REFUNDED",ordreStatus:"ORDER CANCELLED"});
            }
        }

        res.redirect("/admin/orderManagement");
    } catch (error) {
        console.log(error);
        res.status(500).send({ error: "Internal server error" });
    }
};

// --------------- function for orderde product status changing
const orderProductStatus = async (req,res)=>{
    try{
        const { status,productId,orderId } = req.body;
        const order = await Order.findById(orderId);

        const singleOrder = await Order.findOneAndUpdate(
                        { _id: orderId, 'products.productId': productId },
                        { $set: {'products.$.productOrderStatus': status} },
                        { new: true }
                    );

        if(order.paymentDetails === "COD" || order.paymentDetails === "RAZORPAY" || order.paymentDetails === "WALLET" ){
            const updateOptions = {
                orderStatus : "ORDER CANCELLED",
                paymentStatus : "PAYMENT REFUNDED",
                productOrderStatus : status,
            };

        }
        
        res.redirect('/admin/orderManagement')
 
    }catch(error){
        console.log(error);
        res.status(500).send({ error: "Internal server error" });
    }
} 

// --------------------- function for canceling ordered product
const productCancelAccept = async (req, res) => {
    try {
        const { orderId, productId } = req.query;
        const order = await Order.findById(orderId).populate('userId');
        const productItem = order.products.find(item => item.productId.toString() === productId);

        if (['COD', 'RAZORPAY', 'WALLET'].includes(order.paymentDetails)) {
            if (order.paymentStatus === "PAYMENT RECEIVED") {
                const product = await Product.findById(productId);
                if (product) {
                    product.quantity += productItem.quantity;
                    await product.save();
                }

                const refundAmount = (order.totalAmount / order.products.length) * productItem.quantity;

                // Create a wallet update entry
                const walletUpdate = {
                    orderId: order._id,
                    amount: refundAmount,
                    transactionType: "CREDITED",
                    remark: "PRODUCT CANCELLED"
                };

                order.userId.wallet.push(walletUpdate);
                await order.userId.save();
            }

            await Order.findOneAndUpdate(
                { _id: orderId, 'products.productId': productId },
                { $set: { 'products.$.productOrderStatus': "CANCEL REQUEST ACCEPTED" } },
                { new: true }
            );
        }

        res.redirect('/admin/orderManagement');

    } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Internal server error" });
    }
};

//------------------------ function for reject the cancelling of  ordered product
const productCancelReject = async(req,res)=>{
    try{
        const { productId,orderId } = req.query;
        
        await Order.findOneAndUpdate(
            { _id: orderId, 'products.productId': productId },
            { $set: {'products.$.productOrderStatus': "CANCEL REQUEST REJECTED" } },
            { new: true }
        );

        res.redirect('/admin/orderManagement')
    }catch(error){
        console.error(error);
        res.status(500).send({ error: "Internal server error" });
    }
}

// --------------------- function for returning ordered product
const productReturnAccept = async (req, res) => {
    try {
        const { orderId, productId } = req.query;
        const order = await Order.findById(orderId).populate('userId');
        const productItem = order.products.find(item => item.productId.toString() === productId);

        // Check payment details and status
        if (['COD', 'RAZORPAY', 'WALLET'].includes(order.paymentDetails)) {
            if (order.paymentStatus === "PAYMENT RECEIVED") {
                const product = await Product.findById(productId);
                if (product) {
                    product.quantity += productItem.quantity;
                    await product.save();
                }

                // Calculate the refund amount for the canceled product
                const refundAmount = (order.totalAmount / order.products.length) * productItem.quantity;

                const walletUpdate = {
                    orderId: order._id,
                    amount: refundAmount,
                    transactionType: "CREDITED",
                    remark: "PRODUCT RETURNING"
                };

                order.userId.wallet.push(walletUpdate);
                await order.userId.save();
            }

            await Order.findOneAndUpdate(
                { _id: orderId, 'products.productId': productId },
                { $set: { 'products.$.productOrderStatus': "RETURN REQUEST ACCEPTED" } },
                { new: true }
            );
        }

        res.redirect('/admin/orderManagement');

    } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Internal server error" });
    }
};

// -------------------------- function for reject returing
const productReturnReject = async(req,res)=>{
    try{
        const { productId,orderId } = req.query;
        
        await Order.findOneAndUpdate(
            { _id: orderId, 'products.productId': productId },
            { $set: {'products.$.productOrderStatus': "RETURN REQUEST REJECTED" } },
            { new: true }
        );
        res.redirect('/admin/orderManagement');

    }catch(error){
        console.error(error);
        res.status(500).send({ error: "Internal server error" })
    }
}

//* ------------------------ offer details -----------------------

// ---------------------product offer managment list
const ProductOfferMangement = async(req,res)=>{
    try{
        const {page = 1,limit = 10} = req.query;
        const currentPage = parseInt(page);
        const skip = (currentPage-1)*limit; 
        const productOffer = await Product.find().limit(+limit).skip(skip);
        const count = await Product.countDocuments();
        totalPages = Math.ceil(count/limit);
        const modalProductView = req.query.Productid;

        // Check if the success parameter is present in the query
        const successMessage = req.query.success === 'true' ? "Product offer added successfully." : null;

        res.render('listProductOffer',{product:productOffer,pname:modalProductView,totalPages,currentPage,limit,successMessage});
    }catch(error){
        console.log("error occured in loading product offer page",error);
    }
}
 
// ------------------ add product offer
const productOffer = async(req,res)=>{
    try{
        const {productid,perdiscount} = req.body;     
         
        if (perdiscount > 50) {
            return res.status(400).json({ error: "Discount percentage cannot be more than 50%" });
        }
        
        const product = await Product.findById(productid);
        const offerPrice = Math.floor((1 - (perdiscount / 100)) * product.price);

        await Product.findByIdAndUpdate(
                    productid,
                    {$set: {offerType:'product-offer',offerPrice: offerPrice}}
                )

        res.status(200).json({ success: true });
    }catch(error){
        console.log("error in adding product offer",error);
        res.status(500).json({ error: "Internal server error" });
    }
}

// ----------------- delete product offer
const cancelOffer = async(req,res)=>{
    try{
        const { productid } = req.query;
        const product = await Product.findByIdAndUpdate(
            productid,
            { $set : { offerPrice : null,offerType : null}},
            { new : true }
            );
        res.json({ success: true, message: "Offer canceled successfully." });
        // res.redirect('/admin/ProductOfferMangement');
    }catch(error){
        console.log('error in cancel product offer',error);
        res.status(500).json({ error: "Internal server error" });
    }
}

//----------------------- category offermanagement list
const categoryOfferMangement = async(req,res)=>{
    try{
        const { page = 1,limit = 10 } = req.query;
        const currentPage = parseInt(page);
        const skip = (currentPage-1)*limit;
        const categoryOffer = await Category.find().limit(+limit).skip(skip);
        const count = await Category.countDocuments();
        totalPages = Math.ceil(count/limit);
        res.render('listCategoryOffer',{category:categoryOffer,totalPages,currentPage,limit});
    }catch(error){
        console.log("error occured in loading category offer page",error);
    }
}

// ----------------------- add category offer
const categoryOffer = async (req, res) => {
    try {
        console.log("category offer")
        const { categoryid, discount } = req.body;
        const category = await Category.findById(categoryid);
        const numericDiscount = parseInt(discount);

        const offer = await Product.updateMany(
            { category: category._id, $or:[ {offerType: { $exists: false } },{offerType: null} ] },
            [{
                $set: {
                    offerType: 'category-offer',
                    offerPrice: { $floor: { $multiply: ['$price', { $subtract: [1, { $divide: [numericDiscount, 100] }] }] } }
                }
            }]
        );

        const categoryOffer = await Category.findByIdAndUpdate({_id: categoryid},{offer:true})

        res.redirect('/admin/categoryOfferMangement');
    } catch (error) {
        console.log("error in adding category offer", error);
        res.status(500).send('Internal server error');
    }
}

// ------------------ cancel category offer 
const cancelCategoryOffer = async (req, res) => {
    try {
        const { categoryid } = req.query;
        const category = await Category.findById(categoryid);

        const cancelOffer = await Product.updateMany(
            { category: category._id, offerType: 'category-offer' },
            { $set: { offerPrice: null, offerType: null } },
            { new: true }
        );

        const categoryOffer = await Category.findByIdAndUpdate(
            { _id: categoryid },
            { offer: false }
        );

        res.redirect('/admin/categoryOfferMangement');
    } catch (error) {
        console.log('error in cancel category offer', error);
        res.status(500).send('Internal server error');
    }
};

// ------------ sales report creating
const createSalesReport = async (req, res) => {
    try {
        let report;
        let selectedPeriod = req.session.period;

        if (selectedPeriod === "") {
            report = await Order.find();

        } else if (selectedPeriod === "day") {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const endOfDay = new Date(today);
            endOfDay.setHours(23, 59, 59, 999);
            const query = {
                createdAt: {
                    $gte: today,
                    $lt: endOfDay,
                },
                paymentStatus: 'PAYMENT RECEIVED'
            };
            report = await Order.find(query);
        } else if (selectedPeriod === "week") {
            const today = new Date();
            const sevenDaysAgo = new Date(today);
            sevenDaysAgo.setDate(today.getDate() - 7);
            sevenDaysAgo.setHours(0, 0, 0, 0);
            const endOfDay = new Date(today);
            endOfDay.setHours(23, 59, 59, 999);
            const query = {
                createdAt: {
                    $gte: sevenDaysAgo,
                    $lt: endOfDay,
                },
                paymentStatus: 'PAYMENT RECEIVED'
            };
            report = await Order.find(query);
        } else if (selectedPeriod === "month") {
            const today = new Date();
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(today.getDate() - 30);
            const query = {
                createdAt: {
                    $gte: thirtyDaysAgo,
                    $lt: today,
                },
                paymentStatus: 'PAYMENT RECEIVED'
            };
            report = await Order.find(query);
        } else if (selectedPeriod === "year") {
            const today = new Date();
            const oneYearAgo = new Date(today);
            oneYearAgo.setFullYear(today.getFullYear() - 1);
            const endOfYear = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
            const query = {
                createdAt: {
                    $gte: oneYearAgo,
                    $lt: endOfYear,
                },
                paymentStatus: 'PAYMENT RECEIVED'
            };
            report = await Order.find(query);
        }

        // Create a new workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report');

        // Add header row
        worksheet.columns = [
            { header: 'No', key: 'no', width: 10 },
            { header: 'Order Id', key: 'orderId', width: 20 },
            { header: 'Payment Mode', key: 'paymentMode', width: 15 },
            { header: 'Coupon', key: 'coupon', width: 20 },
            { header: 'Discount', key: 'discount', width: 15 },
            { header: 'Total', key: 'total', width: 15 },
        ];

        // Add data rows
        report.forEach((order, index) => {
            worksheet.addRow({
                no: index + 1,
                orderId: "#ord-" + String(order._id).slice(4, 12),
                paymentMode: order.paymentDetails,
                coupon: order.coupon,
                discount: order.discount,
                total: order.totalAmount,
            });
        });

        // Set response headers
        res.setHeader('Content-Disposition', 'attachment; filename=sales_report.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        // Write workbook to response
        await workbook.xlsx.write(res);
        res.end();
        
    } catch (error) {
        console.log("Error in creating sales report", error);
        res.status(500).send('Internal server error');
    }
};

// --------------- order report view in admin side
const reportView = async (req, res) => {
    try {
        const selectedPeriod = req.query.period || "";
        req.session.period = selectedPeriod;
        let report = [];
        if (selectedPeriod === "") {
            report = await Order.find();

        } else if (selectedPeriod === "day") {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const endOfDay = new Date(today);
            endOfDay.setHours(23, 59, 59, 999);
            const query = {
                createdAt: {
                    $gte: today,
                    $lt: endOfDay,
                },
                paymentStatus: 'PAYMENT RECEIVED'
            };
            report = await Order.find(query);
            const numberOfDocuments = await Order.countDocuments(query);

        } else if (selectedPeriod === "week") {
            const today = new Date();
            const sevenDaysAgo = new Date(today);
            sevenDaysAgo.setDate(today.getDate() - 7);
            sevenDaysAgo.setHours(0, 0, 0, 0);
            const endOfDay = new Date(today);
            endOfDay.setHours(23, 59, 59, 999);

            const query = {
                createdAt: {
                    $gte: sevenDaysAgo,
                    $lt: endOfDay,
                },
            };
            report = await Order.find(query);
            const numberOfDocuments = await Order.countDocuments(query);

        } else if (selectedPeriod === "month") {
            const today = new Date();
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(today.getDate() - 30);

            const query = {
                createdAt: {
                    $gte: thirtyDaysAgo,
                    $lt: today,
                },
            };
            report = await Order.find(query);
            const numberOfDocuments = await Order.countDocuments(query);

        } else if (selectedPeriod === "year") {
            const today = new Date();
            const oneYearAgo = new Date(today);
            oneYearAgo.setFullYear(today.getFullYear() - 1);
            const endOfYear = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);

            const query = {
                createdAt: {
                    $gte: oneYearAgo,
                    $lt: endOfYear,
                },
            };
            report = await Order.find(query);
            const numberOfDocuments = await Order.countDocuments(query);
        }

        res.render("adminSalesReport", { report });
    } catch (error) {
        console.log("error in sales report view", error);
        res.status(500).send('Internal server error');
    }
}

//----------------------- custom sales report
const customSalesReport = async (req, res) => {
    try {
        const { start, end } = req.query;
        // Validate the dates
        if (!start || !end) {
            return res.status(400).send('Start and End dates are required');
        }
        const startDate = new Date(start);
        const endDate = new Date(end);

        // Adjust endDate to include the entire day
        endDate.setHours(23, 59, 59, 999);
        // Query the orders based on the date range
        const orders = await Order.find({ 
            createdAt: {
                $gte: startDate,
                $lte: endDate
            },paymentStatus: 'PAYMENT RECEIVED'
        });
        console.log("Retrieved orders:", orders);
        // Send the orders as a JSON response
        res.json(orders);
    } catch (error) {
        console.error('Error in custom sales report controller', error);
        res.status(500).send('Internal server error');
    }

};








module.exports = {
    adminHome,
    adminLoginpage,
    adminLogin,
    adminLogout,
    listUserPage, 
    userStatusChange,
    orderManagement,
    orderDetail,
    orderStatus,
    orderProductStatus,
    productCancelAccept,
    productCancelReject,
    productReturnAccept,
    productReturnReject,
    ProductOfferMangement,
    categoryOfferMangement,
    productOffer,
    cancelOffer,
    categoryOffer,
    cancelCategoryOffer,
    createSalesReport,
    reportView,
    customSalesReport,

}