const express = require("express");
const router = express.Router();
const fs = require("fs");
const adminController = require("../controllers/adminController");
const categoryController = require("../controllers/categoryController");
const productController = require("../controllers/productController");
const couponController = require("../controllers/couponController");
const adminAuth = require("../middleware/adminAuth");
const productMulter = require("../multer/multer");

//-------------- admin

router.get("/", adminAuth.isLogout, adminController.adminLoginpage);
router.post("/adminlogin", adminController.adminLogin);
router.get("/adminlogout", adminAuth.isLogin, adminController.adminLogout);
router.get("/adminhome", adminAuth.isLogin, adminController.adminHome);

router.get(
  "/createSalesReport",
  adminAuth.isLogin,
  adminController.createSalesReport
);
router.get("/reportView", adminAuth.isLogin, adminController.reportView);
router.get(
  "/customSalesReport",
  adminAuth.isLogin,
  adminController.customSalesReport
);
// router.get("/getCustomSalesReport",adminAuth.isLogin,adminController.getCustomSalesReport);

//------------ Admin-User management

router.get("/adminlistuser", adminAuth.isLogin, adminController.listUserPage);
router.post(
  "/userstatuschange",
  adminAuth.isLogin,
  adminController.userStatusChange
);

//------------ Admin-Category management

router.get(
  "/adminlistcategory",
  adminAuth.isLogin,
  categoryController.listCategoryPage
);
router.post(
  "/addnewcategory",
  adminAuth.isLogin,
  categoryController.addnewCategory
);
router.get(
  "/updatecategorypage",
  adminAuth.isLogin,
  categoryController.updateCategoryPage
);
router.post(
  "/updatecategory/:cid",
  adminAuth.isLogin,
  categoryController.updateCategory
);
router.get(
  "/deletecategory",
  adminAuth.isLogin,
  categoryController.deleteCategory
);
router.post(
  "/softdeletecategory",
  adminAuth.isLogin,
  categoryController.softDeleteCategory
);

//--------------- Admin-product management

router.get(
  "/adminlistproduct",
  adminAuth.isLogin,
  productController.listProductPage
);
router.get(
  "/addproductpage",
  adminAuth.isLogin,
  productController.addproductPage
);
router.post(
  "/addnewproduct",
  productMulter.productUpload.array("image"),
  productController.addnewProduct
);
router.get(
  "/updateproductpage",
  adminAuth.isLogin,
  productController.updateProductPage
);
router.post(
  "/updateproduct/:pid",
  productMulter.productUpload.array("image"),
  productController.updateProduct
);
router.get(
  "/productdelete",
  adminAuth.isLogin,
  productController.productDelete
);
router.post(
  "/softdeleteproduct",
  adminAuth.isLogin,
  productController.softDeleteProduct
);
router.get(
  "/singleimagedelete",
  adminAuth.isLogin,
  productController.singleImageDelete
);

//--------------- Admin order management

router.get(
  "/orderManagement",
  adminAuth.isLogin,
  adminController.orderManagement
);
router.get("/orderDetail", adminAuth.isLogin, adminController.orderDetail);
router.post("/orderStatus", adminAuth.isLogin, adminController.orderStatus);
router.post(
  "/orderProductStatus",
  adminAuth.isLogin,
  adminController.orderProductStatus
);
router.get(
  "/productCancelAccept",
  adminAuth.isLogin,
  adminController.productCancelAccept
);
router.get(
  "/productCancelReject",
  adminAuth.isLogin,
  adminController.productCancelReject
);
router.get(
  "/productReturnAccept",
  adminAuth.isLogin,
  adminController.productReturnAccept
);
router.get(
  "/productReturnReject",
  adminAuth.isLogin,
  adminController.productReturnReject
);

//--------------- Admin offer management

router.get(
  "/ProductOfferMangement",
  adminAuth.isLogin,
  adminController.ProductOfferMangement
);
router.post("/productOffer", adminController.productOffer);
router.get("/cancelOffer", adminController.cancelOffer);
router.get(
  "/categoryOfferMangement",
  adminAuth.isLogin,
  adminController.categoryOfferMangement
);
router.post("/categoryOffer", adminController.categoryOffer);
router.get("/cancelCategoryOffer", adminController.cancelCategoryOffer);

// ------------------- admin coupon managment

router.get(
  "/couponManagementPage",
  adminAuth.isLogin,
  couponController.couponManagementPage
);
router.post("/addCoupon", couponController.addCoupon);
router.post("/softDeleteCoupon", couponController.softDeleteCoupon);
router.post("/updateCoupon", couponController.updateCoupon);

module.exports = router;
