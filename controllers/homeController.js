
const User = require('../models/userModel');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Coupon = require('../models/couponModel');



// ------------home page
const homePage = async(req,res)=>{
    try{
        let user = null; 
        if (req.session?.user_id){
            user = await User.findById(req.session.user_id);
            if (!user.isActive){
                user = null;
                console.log("your account has been blocked from admin. contact admin")
            } 
            console.log(user)
        }
        
        const menHome = await Product.find({gender:'Men',isListed:true,}).sort({createdAt:-1}).limit(8) ||null; 
        const womenHome = await Product.find({gender:'Woman',isListed:true,}).sort({createdAt :-1}).limit(8);

        res.render('homePage',{user:user,menHome,womenHome});  
    }catch(error){
        console.error('Error loading:',error);
        res.status(404).send('Internal Server Error');
    }
};


//------------- about-us page 
const aboutPage = async(req,res)=>{
    try{
        if(req.session?.user_id){
            const user = await User.findById(req.session.user_id);
            res.render('aboutPage',{user:user});
        }else{
            res.render('aboutPage',{user:null});
        }
    }catch(error){
        console.error('Error rendering about page:', error);
        res.status(404).render('404Page') 
    }
}   

//------------- contact-us page
const contactPage = async(req,res)=>{
    try{
        if(req.session?.user_id){
            const user = await User.findById(req.session.user_id);
            res.render('contactPage',{user:user})
        }else{
            res.render('contactPage',{user:null});
        }
    }catch(error){
        console.error('Error rendering about page:', error);
        res.status(404).render('404Page');
    }
}

//------------- mens-shop page
const menProductList = async(req,res)=>{
    try{ 
        let user = null;
        if (req.session?.user_id){
            user = await User.findById(req.session.user_id);
        }
        const category = await Category.find();

        // pagination
        const limit = 9;
        const page = req.query.page ? parseInt(req.query.page):1;   // current page number
        const productPage = await Product.find({gender:'Men',isListed:true}).skip((page-1)*limit).limit(limit);
        const totalProduct = await Product.find({gender:'Men',isListed:true}).countDocuments();
        const totalPages = Math.ceil(totalProduct / limit);
        
        res.render('mensProductPage',{user:user,products:productPage,limit,page,totalPages,category});
    }catch(error){
        console.error("Error occurred in rendering men's products page:",error);
        res.status(500).send('Internal Server Error');
    }
};


//------------- womens-shop page
const womenProductList = async(req,res)=>{
    try{
        let user = null
        if(req.session?.user_id){
            user = await User.findById(req.session.user_id);
        }  

        // pagination
        const limit = 9;
        const page = req.query.page ? parseInt(req.query.page):1;   // current page number
        const productPage = await Product.find({gender:'Woman',isListed:true}).skip((page-1)*limit).limit(limit);
        const totalProduct = await Product.find({gender:'Woman',isListed:true}).countDocuments();
        const totalPages = Math.ceil(totalProduct / limit);

        res.render('womensProductPage',{user:user,products:productPage,limit,page,totalPages});
    }catch(error){
        console.log("ocuur error in loading womens produts page",error);    
        res.status(500).send('Internal Server Error');
    }
}

//------------- product details display page
const productDetailPage = async(req,res,next)=>{
    try {
        let user = null;
        if (req.session?.user_id){
            user = await User.findById(req.session.user_id);
        }

        const pid = req.query.pid;
        const product = await Product.findById(pid);
        const category = await Category.find();

        // display related product
        const relatedProduct = await Product.find({
            _id : {$ne:pid}, 
            category : product.category,
            gender : product.gender
        }).limit(4);

        res.render('productDetailPage',{user,product,category,relatedProduct});
    }catch(error){
        console.error("Error occurred while loading product detail page:", error);
        // res.status(500).send('Internal Server Error');
        next(error)
    }
}

//--------------- function for sorting  the  product
const productSort = async (req, res) => {
    try {
        const { sort } = req.query;

        let sortOptions = {};
        if (sort === "priceLowToHigh") {
            sortOptions = { price: 1 };
        } else if (sort === "priceHighToLow") {
            sortOptions = { price: -1 };
        } else if (sort === "ascending") {
            sortOptions = { productName: 1 };
        } else if (sort === "descending") {
            sortOptions = { productName: -1 };
        } else if (sort === "newestArrival") {
            sortOptions = { createdAt: -1 };
        }else {
            sortOptions = { createdAt: 1 };
        }

        const productSort = await Product.find({gender:"Men"}).sort(sortOptions);
        res.status(200).json(productSort); 
    } catch (error) {
        console.log("found an error in productSort controller ");
        res.status(500).json({ message: error.message });
    }
};


//--------------- function for filtering size of  the  product
const filterSize = async (req, res) => {
    try {
        const { size } = req.query;

        let filterOptions = {};
        if (size === "small") {
            filterOptions = { size: "S" };
        } else if (size === "medium") {
            filterOptions = { size: "M" };
        } else if (size === "large") {
            filterOptions = { size: "L" };
        }

        const productsBySize = await Product.find({ gender: "Men", ...filterOptions });
        res.status(200).json(productsBySize);
    } catch (error) {
        console.log(error, "error in filtering products by size");
        res.status(500).json({ message: error.message });
    }
};



//--------------- function for filtering category of  the  product
const categoryFilter = async (req, res) => {
    try {
        const { filter } = req.query;

        let filterOptions = {};
        if (filter === "shirts") {
            filterOptions = { 'category.categoryName': "Shirt" };
            console.log("->",filterOptions);
        } else if (filter === "t-shirts") {
            filterOptions = { 'category.categoryName': "T-shirt" };
            console.log("-->",filterOptions);
        } else if (filter === "jeans") {
            filterOptions = { 'category.categoryName': "Jeans" };
            console.log("--->",filterOptions);
        } 

        const categoryFilter = async (req, res) => {
            try {
                const { filter } = req.query;
        
                let filterOptions = {};
                if (filter === "shirts") {
                    filterOptions = { "category.categoryName": "Shirt" }; 
                } else if (filter === "t-shirts") {
                    filterOptions = { "category.categoryName": "T-Shirt" };
                } else if (filter === "jeans") {
                    filterOptions = { "category.categoryName": "Jeans" };
                }
        
                const categoryFilter = await Product.find({ gender: "Men" })
                    .populate('category')
                    .where(filterOptions)

                console.log('====>',categoryFilter);
        
                res.status(200).json(categoryFilter);
            } catch (error) {
                console.log("Found an error in product category filter controller:", error);
                res.status(500).json({ message: error.message });
            }
        }
        

        res.status(200).json(categoryFilter);
    } catch (error) {
        console.log("found an error in product category filter controller ", error);
        res.status(500).json({ message: error.message });
    }
};

// ----------------- searching
const searchResult = async (req, res) => {
    try {

        let user = null;
        if (req.session.user_id) {
            user = await User.findById(req.session.user_id);
        }

        const { searchquery } = req.query;
        const limit = 9;
        const page = req.query.page ? parseInt(req.query.page) : 1;

        // Find categories that match the search query
        const categories = await Category.find({
            categoryName: { $regex: new RegExp(searchquery, 'i') }
        });

        const categoryIds = categories.map(category => category._id); // Extract category IDs

        // Find products that match the search query in productName or belong to the found categories
        const products = await Product.find({
            isListed: true,
            $or: [
                { productName: { $regex: new RegExp(searchquery, 'i') } },
                { category: { $in: categoryIds } }
            ]
        }).populate('category').skip((page - 1) * limit).limit(limit);

        // Count total products matching the search query for pagination
        const totalProduct = await Product.countDocuments({
            isListed: true,
            $or: [
                { productName: { $regex: new RegExp(searchquery, 'i') } },
                { category: { $in: categoryIds } }
            ]
        });

        const totalPages = Math.ceil(totalProduct / limit);

        // Fetch all categories for the filter
        const allCategories = await Category.find();

        res.render('searchProduct', { 
            category: allCategories,
            user: user,
            products: products,
            search: searchquery,
            limit: limit,
            page: page,
            totalPages: totalPages 
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};




module.exports = {
    homePage,
    aboutPage,
    contactPage,
    menProductList,
    womenProductList,
    productDetailPage,
    productSort,
    filterSize,
    categoryFilter,
    searchResult,
}