
const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');
const cartController = require('../controllers/cart&wishlistController');
const orderController = require('../controllers/orderController');
const couponController = require('../controllers/couponController');
const {isLogin, isLogout, isActive} = require('../middleware/userAuth');



// --------------- home
router.get('/',isActive,homeController.homePage);
router.get('/aboutPage',isActive,homeController.aboutPage); 
router.get('/contactPage',isActive,homeController.contactPage); 

//-------------------- products display page
router.get('/menproductlist',isActive,homeController.menProductList);
router.get('/womenproductlist',isActive,homeController.womenProductList);
router.get('/productdetailpage',isActive,homeController.productDetailPage);

//------------------- cart
router.get('/cartPage',isLogin,isActive,cartController.cartPage);
router.post('/addToCart',cartController.addToCart);
router.post('/removeFromCart',cartController.removeFromCart);
router.post("/changequantity",cartController.updateQuantity);
router.get("/checkcart",orderController.checkcart);

// ------------------ checkout 
router.get('/checkoutPage',isLogin,isActive,orderController.checkoutPage);
router.post('/orderPayment',orderController.orderPayment);
router.post('/verifyPayment',orderController.verifyPayment);
router.post('/applyCoupon',couponController.applyCoupon);

// ------------------- invoice creation
router.get('/downloadInvoice',isLogin,isActive,orderController.downloadInvoice);

// ------------------ wishlist
router.get('/wishlistPage',isLogin,isActive,cartController.wishlistPage);
router.post('/addToWishlist',cartController.addToWishlist);
router.post('/removeWishlistItem',cartController.removeWishlistItem);

//----------------search,sort,filter
router.get('/mensProductSort',homeController.mensProductSort);
router.get('/womansProductSort',homeController.womansProductSort);
router.get('/productSort',homeController.productSort);
router.get('/categoryFilter',homeController.categoryFilter);
router.get('/filterSize',homeController.filterSize);
router.get('/searchResult',homeController.searchResult);



module.exports = router 