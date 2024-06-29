
const User = require('../models/userModel');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const Coupon = require('../models/couponModel');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const crypto = require('crypto');
const {log} = require('console');

dotenv.config({path:".env"}); 


//--------- new user creation 
const userCreation = async(req,res)=>{
    try{
        const users = await User.find({email:req.body.email});
        // console.log(users);
        if(users.length>0){
            res.render('homePage',{ msg:"Email is already Exist",user:null });
            console.log("Email is already Exist")
        }else{  
            if(req.body.password !== req.body.confirmPassword){
                res.render('homePage',{ msg:"password not match",user:null}); 
                console.log("password not match")
            }else{
                const {username,email,phone,password} = req.body;
                const user = {username,email,phone,password};
                const otp = await sendMail(user.username,user.email);
                req.session.otp = otp;
                req.session.userDetails = user;  // store user details in session
                res.render('userOTPvarification',{user,wrongotp:false});
            };
        }
    }catch(error){
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};

//---------- user sign-up with OTP verification 
// const userOTPvarification = async(req,res)=>{
//     try{
//         // console.log(req.session.otp)
//         const otpEntered = `${req.body.verify1}${req.body.verify2}${req.body.verify3}${req.body.verify4}`;
//         console.log(otpEntered)
//         if (req.session.otp === otpEntered){           // Check if the OTP matches the one stored in the session
//             const hashedPassword = await encryptPassword(req.session.userDetails.password);

//             const {username,email,phone} = req.session.userDetails;

//             // Create a new user object
//             const newUser = new User({
//                 username,
//                 email, 
//                 phone,
//                 password: hashedPassword, 
//             });

//             const savedUser = await newUser.save();           // Save  the new user to the database
//             console.log("New user created:",savedUser.username);

//             // Clear the session data after user registration
//             req.session.otp = null;
//             req.session.userDetails = null;
//             req.session.user_id = savedUser._id;  // Override session data with new user ID

//             res.redirect('/'); 
//         } else {
//             console.log("Incorrect OTP entered");
//             res.render('userOTPvarification', { user:req.session.userDetails,wrongOtp: true,msg:"Incorrect OTP entered" });
//         }
//     } catch (error) {
//         console.error('Error in userOTPverification:', error);
//         res.status(500).send('Internal Server Error');
//     }
// };

const userOTPvarification = async (req, res) => {
    try {
        const otpEntered = `${req.body.verify1}${req.body.verify2}${req.body.verify3}${req.body.verify4}`;
        if (req.session.otp === otpEntered) {
            const hashedPassword = await encryptPassword(req.session.userDetails.password);
            const { username, email, phone } = req.session.userDetails;

            const newUser = new User({
                username,
                email,
                phone,
                password: hashedPassword,
            });

            const savedUser = await newUser.save();
            req.session.otp = null;
            req.session.userDetails = null;
            req.session.user_id = savedUser._id;

            res.json({ success: true, redirectUrl: '/' });
        } else {
            res.json({ success: false, message: 'You are entered incorrect OTP ' });
        }
    } catch (error) {
        console.error('Error in userOTPverification:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};


//------------- Resend OTP 
const resendOTP = async(req,res)=>{
    try {
        // Check if user details are present in the session
        const {userDetails,otp} = req.session;
        if (!userDetails){
            return res.status(400).send("User details not found in session");
        }

        // Check if the session already has an OTP
        if (otp){
            delete req.session.otp;            // Delete the old OTP from the session
            console.log(" old otp deleted")
        }

        // Your logic to generate and send the OTP via email
        const newOTP = generateOTP();   // Generate a new OTP
        console.log("new otp created",newOTP) 
        const { username,email } = userDetails;
        await sendMail(username,email,newOTP);          // Send the new OTP via email

        // Update session with the new OTP
        req.session.otp = newOTP;  
    
        // res.redirect('/');
        res.status(200).send("OTP Resent Successfully");
    }catch(error){
        console.error('Error in resending OTP:', error);
        res.status(500).send('Internal Server Error'); 
    }
}

// ------------ user login 
// const userLogin = async(req,res) => {
//     try{
//         const { email, password } = req.body;
//         const userDetails = await User.findOne({ email: email });

//         if(!userDetails || !userDetails.isActive){
//             console.log("Invalid email or blocked account");
//             return res.redirect('/');
//         }

//         const passwordMatch = await bcrypt.compare(password, userDetails.password);
//         if(passwordMatch){
//             const { _id: userId, username } = userDetails;
//             req.session.user_id = userId;
//             req.session.user = username;
//             console.log("User logged in successfully");
//             return res.redirect('/');
//         }else{
//             console.log("Invalid password");
//             return res.redirect('/');
//         } 
//     }catch(error){
//         console.error('Error in userLogin:', error);
//         return res.status(500).send('Internal Server Error');
//     }
// };

const userLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const userDetails = await User.findOne({ email: email }); 

        if (!userDetails) {
            console.log("Invalid email");
            return res.status(401).json({ emailMsg : "Enter Correct Email", email: email });
        }

        if (!userDetails.isActive) {
            console.log("Blocked user account");
            return res.status(401).json({ blocked : true, blockedMsg: "Sorry ! Your Account Is Blocked" });
        }

        const passwordMatch = await bcrypt.compare(password, userDetails.password);
        if (!passwordMatch) {
            console.log("Invalid password");
            return res.status(401).json({ passwordMsg : "Enter Correct Password" });
        }

        const { _id: userId, username } = userDetails;
        req.session.user_id = userId;
        req.session.user = username;
        console.log("User logged in successfully");
        return res.status(200).json({ success: true, msg: "Login successful" });

    } catch (error) {
        console.error('Error in userLogin:', error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};



//------------ User logout 
const userLogout = async(req,res)=>{
    try{
        req.session.destroy((error)=>{
            if(error){
                console.log('Error destroying session:',error);
                res.status(500).send('Internal Server Error');
            }
            console.log("user logout successfully")
            res.redirect('/');
        });
    }catch(error){
        console.log('Error during user logout:',error);
        res.status(500).send('Internal Server Error');
    }
}

//------------ User profile Page
const userProfile = async(req,res)=>{   
    try{
        if(!req.session.user_id){
            console.error("user id not valid in session"); 
            res.status(401).send("Unauthorized");
        }

        const user = await User.findById(req.session.user_id);
        const walletBalance = user.wallet.map((balance)=>balance.amount).reduce((acc,total)=>acc+total,0);
        const roundededWalletBalance = Math.floor(walletBalance);

        if(!user){
            console.error("User not found");
            return res.status(404).send("User not found");
        } 

        // const orders = await Order.find({ userId: req.session.user_id }).sort({ createdAt: -1 }).populate('userId');
        const orders = await Order.find({ userId: req.session.user_id }).sort({ createdAt: -1 });

        // order list pagination
        const {page = 1,limit = 10} = req.query;
        const currentPage = parseInt(page); // Convert page to a number
        const skip = (currentPage-1)*limit; 
        const orderPagnation = await Order.find().limit(+limit).skip(skip).populate('userId').sort({createdAt:-1}); 
        const count = await Order.countDocuments();
        totalPages = Math.ceil(count / limit);

        res.render('userProfile',{user,wallet:roundededWalletBalance,order:orders,orderPagnation,totalPages,currentPage,limit});
        // res.render('userProfile',{user,wallet:walletBalance,order:orders,orderPagnation,totalPages,currentPage,limit});
    }catch(error){
        console.log("Error in user controller userProfile",error.stack);
        res.status(500).send('Internal Server Error');
    }
}

//-------------- Edit user profile
const editProfilePage = async(req,res)=>{
    try{
        const user = await User.findById(req.session.user_id);
        if(!user){
            console.log("User not found");
            return res.status(404).send('User not found');
        }
        res.render('editProfilePage',{user})
    }catch(error){
        console.log("Error in userProfile editing",error);
        res.status(500).send('Internal Server Error');
    }
}

//--------------- Edit user profile details
const editProfile = async(req,res)=>{
    try{
        const userId = req.session.user_id; 
        const user = await User.findById(userId);

        if(!user){
            console.log("User not found");
            return res.status(404).send('User not found');
        }
        
        const {email,username,phone} = req.body;

        // Check if a similar user already exists
        const similarUser = await User.find({$and:[{_id:{ $ne: user._id}},{email:email}]});

        if(similarUser.length === 0){
        user.email = email;
        user.username = username;
        user.phone = phone;

        await user.save();
        res.redirect('/userProfile'); 
        }else{
            console.log("User with the same username or email already exists");
            res.status(400).send('User with the same username or email already exists');
        }
    }catch(error){
        console.log("Error in updating user profile:", error);
        res.status(500).send('Internal Server Error');
    }
}

// -------------- adding profile picture to user
const addProfilePicture = async(req,res)=>{
    try{
        const userId = req.session.user_id;
        if(!userId || !req.file){
            return res.status(400).send({message:'User ID or file is missing.'});
        }
        const image = req.file.filename;
        const user = await User.findByIdAndUpdate(
            userId,{image:image},{new:true}
        );
        if(!user){
            return res.status(404).send({message: 'User not found.'});
        }
        res.redirect('/userProfile');
    }catch(error){
        console.log("Error in adding user profile picture:",error);
        res.status(500).send('Internal Server Error');
    }
}

//------------- Adding New Address
const addUserAddress = async(req,res)=>{
    try {
        const { fullname,addressline1,addressline2,email,phone,city,state,country,pincode,addresstype } = req.body;
        const userId = req.session.user_id;
        const user = await User.findById(userId);
        const newUserAddress = {
            fullName: fullname,
            addressLine1: addressline1,
            addressLine2: addressline2 || "",
            email: email,
            phone: phone,
            city: city,
            state: state,
            country: country,
            pinCode: pincode,
            addressType: addresstype,
            main: user.address.length === 0 ? true : false
        };
        user.address.push(newUserAddress);
        await user.save();
        res.redirect('/userProfile');
    } catch (error) {
        console.log("Error in adding new address:", error);
        res.status(500).send('Internal server error');
    }
};

//---------------- update address page
const updateAddressPage = async(req,res)=>{
    try{
        const aid = req.query.aid;
        const user = await User.findById(req.session.user_id);
        // const address = user.address[aid];
        const address = user.address.id(aid);
        res.render('updateAddressPage',{user,address});
    }catch(error){
        console.log("error in update Page load ");
        res.status(404).send('page not found');
    } 
}

//------------- update address
const updateAddress = async (req, res) => {
    try {
        const { fullname, addressline1, addressline2, email, phone, city, state, country, pincode, addresstype, aid } = req.body;
        console.log("Received parameters:", req.body);
        const userId = req.session.user_id;
        console.log("====",userId);
        if(!userId){
            console.log("User ID not found in session");
            return res.status(401).send('Unauthorized');
        }
        // Update the address fields using $set operator
        const updatedUser = await User.findOneAndUpdate(
            {
                _id: userId,
                'address._id': aid
            },
            {
                $set: {
                    'address.$.fullName': fullname,
                    'address.$.addressLine1': addressline1,
                    'address.$.addressLine2': addressline2 || "",
                    'address.$.email': email,
                    'address.$.phone': phone,
                    'address.$.city': city,
                    'address.$.state': state,
                    'address.$.country': country,
                    'address.$.pinCode': pincode,
                    'address.$.addressType': addresstype,
                }
            },
            { new: true }
        );
        if(updatedUser){
            console.log('User address updated:', updatedUser);
            res.redirect('/userProfile');
        }else{
            console.log('Address not found or update failed');
            res.status(404).send('Address not found');
        }
    }catch(error){
        console.log("Error found in update address:", error);
        res.status(500).send('Internal server error');
    }
}

// ----------- delete address
const deleteAddress = async(req,res)=>{
    try{
        const aid = req.query.aid;
        const userId = req.session.user_id;
        const updatedUser = await User.findOneAndUpdate(
            { _id: userId },
            { $pull: { address: { _id: aid } } },
            { new: true }
        );
        console.log('User address deleted:', updatedUser);
        res.json({success : true, message : 'address deleted successfully'})
        // res.redirect('/userProfile');
    }catch(error){
        console.log("error in deleteAddress function",error);
        res.status(500).json({success : false, message :'Internal server error'});
    }
}


// ----------------- forgot password and reset 
const passwordForgetPage = async(req,res)=>{
    try{
       res.render('forgetPassword',{user:null});
    }catch(error){
        console.log('error in forget password page loading');
        res.status(404).send('page not found');
    }
}

// ---------------- password forget
const passwordForget = async (req, res) => {
    try {
        const email = req.body.email;
        const user = await User.findOne({ email: email });
        console.log("---->>>>>>>>>>>>" + user);

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid email address' });
        } else {
            const rotp = await sendMail('', email);
            req.session.rotp = rotp;
            console.log(rotp);

            const forgotdata = {
                rotp:rotp,
                email: req.body.email,
                password: req.body.password,
            };
            req.session.forgotdata=forgotdata;

            return res.json({ success: true, redirectUrl: '/passwordForgetOtpPage'});
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// ------------------- forgot password otp page
const passwordForgetOtpPage = async(req,res)=>{
    try{
       res.render('forgetPasswordOtp',{user:null});
    }catch(error){
        console.log('error in forget password page loading');
        res.status(404).send('page not found');
    }
}

// ------------ password forget otp
const passwordForgetOtp = async (req, res) => {
    try {
        const forgotData=req.session.forgotdata;
        const {email,password,rotp}=forgotData;
        console.log(req.body.otp, "opt-s",rotp);
        if (req.body.otp == rotp) {
            const hpassword = await encryptPassword(password);
            console.log("hashed " + hpassword);
            const pwupdate = await User.findOneAndUpdate({ email:email }, { password: hpassword });
            if (pwupdate) {
                console.log(pwupdate?._id);
                req.session.user_id = pwupdate?._id;
                res.status(200).json({ success: true });
            } else {
                res.status(400).json({ success: false, message: 'User not found' });
            }
        } else {
            res.status(400).json({ success: false, message: 'Invalid OTP' });
        }
    } catch (error) {
        console.log("Error occurred in forgot password OTP controller", error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ---------------- update current password
const updatePassword = async(req,res)=>{
    try{
        if(req.body.password === req.body.confirmpassword){
            const hashPassword = await encryptPassword(req.body.password)
            const updatePassword = await User.findByIdAndUpdate(
                {_id:req.session.user_id},
                {password : hashPassword}
            )
            if(updatePassword){
                res.redirect('/userProfile')
            }
        }
    }catch(error){
        console.log("error occur in update password controller");
        res.status(500).send('Internal server error');
    }
}










//* ---------------- Functions are used to create user --------------------

//---------Function for  generate otp
const generateOTP = ()=>{
    return Math.floor(1000 + Math.random() * 9000).toString();
};

//---------Function to encrypt password
const encryptPassword = async(password)=>{
    try{
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    }catch(error){
        console.error('Error encrypting password:', error.message);
        throw error; // Rethrow the error to handle it in the calling function
    }
};

// -------------- Function to send OTP via email 
const sendMail = async(username,email)=>{
    try {
        const otp = generateOTP();
        console.log(otp);

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { 
                user: process.env.EMAIL,
                pass: process.env.PASSWORD,
            }
        });

        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'OTP - Essential',
            text: `Thank you, ${username}, for choosing Essential. Use this OTP to finish signup: ${otp}`
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email has been sent", info.response);
        return otp;

    } catch (error) {
        console.log(error);
        throw error;
    }
};



      

module.exports = {
    userCreation,
    userOTPvarification,
    resendOTP,
    userLogin,
    userLogout,
    userProfile,
    editProfilePage,
    editProfile,
    addProfilePicture,
    addUserAddress,
    updateAddressPage,
    updateAddress,
    deleteAddress,
    passwordForgetPage,
    passwordForget,
    passwordForgetOtpPage,
    passwordForgetOtp,
    updatePassword,
};
