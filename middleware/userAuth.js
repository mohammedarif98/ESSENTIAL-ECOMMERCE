

const User = require('../models/userModel');

const isLogin = async(req,res,next)=>{
    try{
        if(req.session.user_id){
            console.log("isLogin >> user active ");
            next();
        }else{
            console.log("isLogin >> user not active ");
            res.redirect("/");
        }
    }catch(error){
        conole.log(error.message);
    }
}

const isLogout = async(req,res,next)=>{
    try{
        if(!req.session.user_id){
            // console.log(" islogout >>> user not-active");
            next()
        }else{
            console.log(" isLogout >> user active");
            res.redirect('/');
        }
    }catch(error){
        console.log(error.message);
    }
}

const isActive = async (req, res, next) => {
    try {
        const user = await User.findById(req.session.user_id);

        if (user && user.isActive) {
            console.log("is active true middleware >> ");
            next();
        } else {
            req.session.destroy();
            next()
        }
    } catch (error) {
        console.error("Error in isActive middleware:",error);
        res.status(500).send("Internal Server Error");
    }
};



module.exports = {
    isLogin,
    isLogout,
    isActive,

}