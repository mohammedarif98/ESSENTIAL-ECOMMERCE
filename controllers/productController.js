
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const User = require('../models/userModel');
const path = require('path');  
const fs = require('fs');
const sharp = require('sharp');

//-------------------- controller function for product list display in admin dashbord
const listProductPage = async (req, res) => {
    try {
        const {page = 1,limit = 10} = req.query;
        const currentPage = parseInt(page); 
        const skip = (currentPage-1)*limit; 
        const products = await Product.find().populate('category').limit(+limit).skip(skip).exec();
        const count = await Product.countDocuments();
        const totalPages = Math.ceil(count / limit);
        res.render('listProducts',{product:products,totalPages,currentPage,count});
    } catch(error){
        console.log("Error in listing products:", error);
        res.redirect('/admin/adminlistproduct');
    }
}   

//-------------------- controller function for product adding page dispaly
const addproductPage = async(req,res)=>{
    try{
        const categories = await Category.find({isListed:true});
        res.render('addproductPage',{categories});
    }catch(error){ 
        console.log("error occcur in add product page");
    }
}

//-------------------- controller function for adding new products
const addnewProduct = async (req, res) => {
    try{
        const {files,body} = req;
        const fileName  = files.map(file => file.filename);

        let product = new Product({
            productName : body.productname,
            brandName : body.brandname,
            gender : body.gender,
            category : body.productcategory,
            color : body.color,
            price : body.price,
            quantity : body.quantity,
            size : body.size,
            description : body.description,
            images : fileName
        });

        const newProduct = await product.save();

        if(newProduct) {
            res.redirect('/admin/adminlistproduct');
        }else{
            res.redirect('/admin/addproductpage');
        }
    }catch(error){
        console.log("Error found in adding new product",error);
        // res.redirect('/admin/addproductpage'); // Redirect to add product page on error
    }
}

//-------------------- controller function for display products updating page
const updateProductPage = async (req,res)=>{
    try {
        const productId = req.query.pid
        const productData = await Product.findById(productId); 
        const categoryData = await Category.find({},{categoryName:1,_id:1});

        const filterCategory = categoryData.filter(category => {
            return category._id.toString() === productData.category.toString();
        })[0];

        const categoryName = filterCategory ? filterCategory.categoryName : '';

        if (productData) {
            res.render("editProduct",{product:productData,category:categoryData,categoryName});
        } else {
            res.status(404).send('Product not found');
        }
    } catch (error) {
        console.error('Error occurred in editProduct function', error);
        res.status(500).send('Server Error');
    }
};


// -------------------------- controller function for products updating 
const updateProduct = async(req,res)=>{
    try {
        const pid = req.params.pid; 
        const product = await Product.findById(pid);

        if (!product) {
            return res.status(404).send('Product not found');
        }  

        // Update product properties with new values from the request body
        const { productname,brandname,gender,color,price,quantity,size,description,productcategory } = req.body;
        product.productName = productname;
        product.brandName = brandname;
        product.gender = gender; 
        product.color = color;
        product.price = price;
        product.quantity = quantity;
        product.size = size;
        product.description = description;
 
        // Check if there are new images uploaded
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => file.filename);
            product.images = product.images.concat(newImages);
        }

        const categorySelected = await Category.findOne({ categoryName:productcategory });
        product.category = categorySelected ? categorySelected._id : null;

        // Save the updated product
        await product.save();

        res.redirect('/admin/adminlistproduct');
    }catch(error){
        console.log("Error found in updating product:", error);
        res.status(500).send('Server Error');
    }
};
 
//--------------------------- controller func for delete product
const productDelete = async (req,res)=>{
    try{
        const pid = req.query.pid;
        if(!pid){
            return res.status(400).json({success:false,message:"Product ID not provided"});
        }
        const category = await Product.findByIdAndDelete(pid);

        if(!category){
            return res.status(404).json({success:false,message: "Product not found"});
        }
        res.redirect('/admin/adminlistproduct');
    }catch(error){
        console.log("Delete category error:",error);
        res.status(500).json({success:false,message:"Internal Server Error"});
    }
};

//----------------------  controller func for soft Delete
const softDeleteProduct = async(req,res)=>{
    try{
        const pid = req.body.pid;
        
        const product = await Product.findById({_id:pid});
        if(product.isListed){  
            await Product.findByIdAndUpdate(pid,{isListed:false});
            res.status(200).json({Listed : true}) 
        }else{
            await Product.findByIdAndUpdate(pid,{isListed:true});
            res.status(200).json({unListed : true})
        } 
    }catch(error){
        console.log(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

//--------------------- delete single image of product
const singleImageDelete = async(req,res)=>{
    try{
        const pid = req.query.pid;
        const imageDelete = req.query.image;
        // Update the product in the database to remove the image reference
        const product = await Product.findByIdAndUpdate(pid,{$pull:{images : imageDelete}});

        // Delete the image file from the filesystem
        const imagePath = path.join('public','admin','asset','img','product',imageDelete); 
        await fs.promises.unlink(imagePath); 

        console.log("delted image : ",imageDelete);
        res.redirect(`/admin/updateproductpage?pid=${product._id}`);

    }catch(error){
        console.log(error)
        res.status(500).send("server error");
    }
}




module.exports = {
    listProductPage,
    addproductPage,
    addnewProduct,
    updateProductPage,
    updateProduct,
    productDelete,
    softDeleteProduct,
    singleImageDelete
}
