const express = require("express");
const router = express.Router();
const passport = require("passport");
const userAuth = require("../middleware/userAuth");
const userController = require("../controllers/userController");
const orderController = require("../controllers/orderController");
const userProfileMulter = require("../multer/multer");
require("../passport");

// Initialize passport and session middleware
router.use(passport.initialize());
router.use(passport.session());

//--------------- google authentication routes
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile","email"] })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  userController.googleAuth
);


//--------------------- user  registration
// router.get('/userSignup',userAuth.isLogout,userController.loadSignupPage);
router.post("/userSignup", userController.userCreation);
router.post("/userOTPvarification", userController.userOTPvarification);
router.post("/resendOTP", userController.resendOTP);

//--------------------- user Login
// router.get('/userLogin',userAuth.isLogout,userController.loadLoginPage);
router.post("/userLogin", userController.userLogin);
router.get("/userLogout", userAuth.isLogin, userController.userLogout);

//-------------------- user profile
router.get("/userProfile", userAuth.isLogin, userController.userProfile);
router.get(
  "/editProfilePage",
  userAuth.isLogin,
  userController.editProfilePage
);
router.post("/editProfile", userAuth.isLogin, userController.editProfile);
router.post(
  "/addProfilePicture",
  userAuth.isLogin,
  userProfileMulter.userImageUpload.single("image"),
  userController.addProfilePicture
);

//--------------------- user order cancellation
router.get("/orderList", userAuth.isLogin, orderController.orderList);
router.get("/orderDetails", userAuth.isLogin, orderController.orderDetails);
router.get(
  "/cancelOrder",
  userAuth.isLogin,
  userAuth.isActive,
  orderController.cancelOrder
);
router.get(
  "/returnOrder",
  userAuth.isLogin,
  userAuth.isActive,
  orderController.returnOrder
);
router.post(
  "/productCancelRequest",
  userAuth.isLogin,
  userAuth.isActive,
  orderController.productCancelRequest
);
router.post(
  "/productReturnRequest",
  userAuth.isLogin,
  userAuth.isActive,
  orderController.productReturnRequest
);

// ----------------- user forget password
router.get(
  "/passwordForgetPage",
  userAuth.isLogout,
  userController.passwordForgetPage
);
router.post(
  "/passwordForget",
  userAuth.isLogout,
  userController.passwordForget
);
router.get(
  "/passwordForgetOtpPage",
  userAuth.isLogout,
  userController.passwordForgetOtpPage
);
router.post(
  "/passwordForgetOtp",
  userAuth.isLogout,
  userController.passwordForgetOtp
);
router.post("/updatePassword", userAuth.isLogin, userController.updatePassword);

//-------------------- user Address
router.post("/addUserAddress", userController.addUserAddress);
router.get(
  "/updateAddressPage",
  userAuth.isLogin,
  userController.updateAddressPage
);
router.post("/updateAddress", userController.updateAddress);
router.post("/deleteAddress", userAuth.isLogin, userController.deleteAddress);

module.exports = router;
