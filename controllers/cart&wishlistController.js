
const User = require('../models/userModel');
const  Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Order = require('../models/orderModel');
const Coupon = require('../models/couponModel');
const Razorpay=require('razorpay');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const crypto = require('crypto');
 
//------------------- razorpay details
const instance  = new Razorpay({
    key_id: process.env.Razorpay_key_id,
    key_secret: process.env.Razorpay_key_secret,
  });
//--------------------



//* ------------------------ cart ------------------------

const cartPage = async(req,res)=>{
    try{
        let user = null;
        let cartAmount = 0;
        let userCart;
        let cartCount = 0;
        let cartWithOutOffer = 0;

        const category = await Category.find(); 
        const product = await Product.find();
        const coupon = await Coupon.find();

        if (req.session?.user_id){
            user = await User.findById(req.session.user_id);
            userCart = await User.findOne({_id:req.session.user_id}).populate('cart.productId');
            console.log("------>",userCart);
            for(let i=0;i<userCart.cart.length;i++){
                if(userCart.cart[i].productId?.offerPrice){
                    cartAmount = cartAmount + parseInt(userCart.cart[i].productId?.offerPrice)* parseInt(userCart.cart[i]?.quantity);
                    cartCount += parseInt(userCart.cart[i]?.quantity);
                }else{
                    cartAmount = cartAmount + parseInt(userCart.cart[i].productId?.price)* parseInt(userCart.cart[i]?.quantity);
                    cartCount += parseInt(userCart.cart[i]?.quantity);
                }
            }
        }
        res.render('cartPage',{user,product,category,coupon,cartAmount,userCart,cartCount,cartWithOutOffer});
    }catch(error){
        console.log("error in loading cart page.");
        res.status(404).send("page not found");  
    }
}

// --------------------------
const addToCart = async(req,res)=>{
    try {
        let cartmax = false;
        const productId = req.body.productid;
        const product = await Product.findById(productId);

        if(!req.session.user_id){
            return res.status(200).json({notLogin:true});
        }

        const user = await User.findById(req.session.user_id);
        const quantity = 1;

        let itemExist;

        if(user){
            // Checking if the product already exists in the user's cart
            itemExist = user.cart.find((item) =>
                item.productId.equals(productId)
            );
        }

        if(itemExist){
            itemExist.quantity++;
            if (itemExist.quantity > product.quantity) {
                itemExist.quantity = product.quantity;
                cartmax = true;
            }
            await user.save();
            return res.status(200).json({ toCart: true });

        }else{
            // If the product does not exist in the cart
            const updatedUser = await User.findByIdAndUpdate(
                req.session.user_id,
                { $push: { cart: { productId: productId, quantity: quantity } } },
                { new: true } // to return the updated document
            );

            console.log(quantity);
            if(updatedUser){
                const cartCount = updatedUser.cart.length;
                return res.status(200).json({
                    toCart: true,
                    cartcount: cartCount,
                    cartmax: cartmax,
                });
            }else{
                return res.status(200).json({toCart: false, cartmax: false });
            }
        }
    }catch(error){
        console.log("Error in adding a product into cart:", error);
        return res.status(500).send('Internal Server Error');
    }
}

// -----------------------------
const removeFromCart = async(req,res)=>{
    try{
        const user_id = req.session.user_id;
        const cartItemId = req.body.productId;
        const user = await User.findById(user_id);
        const cart = user.cart;

        const newcart=cart.filter((cartitem)=>{
            if(cartitem.productId!=cartItemId){
                return cartitem
            }
        }); 
        user.cart=newcart;
        const usersave=user.save();
        if(usersave){
            res.status(200).json({ itemRemoved:true,cartcount:user.cart.length });  
        }else{
            res.status(200).json({ itemnotRemoved:true });  
        }
    }catch(error){
        console.log("Error in removing a product from cart", error);
        return res.status(500).send('Internal Server Error'); 
    }
}

// ----------------------------
const updateQuantity = async(req,res)=>{
    try {
        console.log(req.body)
        req.body.count = parseInt(req.body.count)
        const updatedata = await User.updateOne({_id: req.session.user_id,'cart.productId': req.body.productId},
                            {$inc:{'cart.$.quantity': req.body.count}},{new:true});

        if(updatedata){
            res.status(200).json({quantityupdated:true})
        }else{
            res.status(404).json({message:"Product not found in the user's cart"});
        }
    }catch(error){
        console.log(error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};


//* --------------------- wishlist ------------------------

const wishlistPage = async (req, res) => {
    try {
        const userId = req.session?.user_id;
        if(userId){
            const user = await User.findById(userId).populate('wishlist.productId').lean();
            res.render('wishlistPage',{ user, userWishlist:user.wishlist });
        }else{
            res.redirect('/');
        }
    }catch(error){
        console.log("Error in loading wishlist page", error);
        res.status(404).send("Page not found");
    }
}

const addToWishlist = async(req,res)=>{
    try{
        const productId = req.body.productId;
        const product = await Product.findById(productId);

        if(!req.session.user_id){
            res.status(200).json({ notLogin : true });
        }
        const user = await User.findById(req.session.user_id);
        if(user){
            const existingItem = user.wishlist.find((item) => item?.productId.equals(productId));
            if(existingItem){
                res.status(200).json({ existing : true });
            }else{
                //If the product is not in the wishlist, add it
                const updatedUser = await User.findByIdAndUpdate(
                     req.session.user_id,
                    { $push : { wishlist : { productId : productId }}},
                    { new:true }                   
                );
                if(updatedUser){
                    const wishlistSize = updatedUser.wishlist.length;
                    res.status(200).json({ addedToWishlist: true, wishlistSize,product }); 
                }else{
                    res.status(200).json({ addedToWishlist : false });   
                }
            } 
        } 
    }catch(error){
        console.log(error);
        // res.status(404).render('error', { message: "Product not found" });
    }
}


const removeWishlistItem = async(req,res)=>{
    try{
        const userId = req.session.user_id;
        const wishItemId = req.body.productId;
        const user = await User.findById(userId);
        const wishlist = user.wishlist;

        const newWishlist = wishlist.filter((wishItem) => {
            if(wishItem.productId != wishItemId){
                return wishItem
            }
        });

        user.wishlist = newWishlist;
        const userSave = await user.save();
        if(userSave){
            const wishlistSize = userSave.wishlist.length;
            res.status(200).json({ itemRemoved : true, wishlistSize });
        }else{
            res.status(200).json({ itemRemoved : false });
        }

    }catch(error){
        console.log("item is removed from wishlist error",error);

    }
}





module.exports = {
    cartPage,
    addToCart,
    removeFromCart,
    updateQuantity,
    wishlistPage,
    addToWishlist,
    removeWishlistItem
}