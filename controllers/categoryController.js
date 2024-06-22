
const Category = require('../models/categoryModel');


//-------------------- controller func for category list display in admin dashbord
const listCategoryPage = async(req,res)=>{
    try{
        const {page = 1,limit = 5} = req.query;
        const currentPage = parseInt(page); 
        const skip = (currentPage-1)*limit; 
        const category = await Category.find().limit(+limit).skip(skip); 
        const count = await Category.countDocuments();
        const totalPages = Math.ceil(count / limit);
        res.render('listCategories',{category:category,totalPages,currentPage});
    }catch(error){
        console.log("error occur in list category",error);
    }
}

//-------------------- controller func for adding new category 
const addnewCategory = async(req,res)=>{
    try{
        const {categoryname,description} = req.body;

        const categoryExist = await Category.findOne({categoryName:categoryname});
        console.log("Category exist:", categoryExist);

        if (categoryExist){
            console.log("Category already exists.");
            return res.redirect('/admin/adminlistcategory');
        }

        const caseInsensitiveCategoryExist = await Category.findOne({
            categoryName:{$regex: new RegExp("^"+categoryname+'$','i')}
        });

        if(caseInsensitiveCategoryExist){
            return res.redirect('/admin/adminlistcategory');
        }

        // If the category doesn't exist, create a new one
        const newCategory = new Category({categoryName:categoryname,description,isListed:true});

        await newCategory.save();
        return res.redirect('/admin/adminlistcategory');

    }catch(error){
        console.log("Error occurred when adding a new category:",error);
        res.status(500).send("Internal Server Error");
    }
}

//------------------- update page of the categories
const updateCategoryPage = async(req,res)=>{
    
    const categoryId = req.query.cid;

    try{
        const category = await Category.findOne({_id:categoryId});
        if(category){
            res.render('editCategory',{category});
        }else{
            res.status(404).send("Category not found");
        }
    }catch(error){
        console.log("Error occurred when updating category:", error);
        res.status(500).send("Internal Server Error");
    }
}

//------------------- update the categories
const updateCategory = async(req,res)=>{
    try{
        const categoryId = req.params.cid; 

        let updateData = {
            categoryName: req.body.categoryname,
            description: req.body.description,
        };

        const categoryResult = await Category.findOneAndUpdate({_id:categoryId},updateData,{new:true});

        if (categoryResult){
            res.redirect("/admin/adminlistcategory");
        } else {
            res.redirect("/admin/updatecategorypage",{err:"Category not updated"});
        }
    }catch(error){
        console.error("Error occurred when updating category:",error);
        res.status(500).send("Internal Server Error");
    }
};

//----------------- deleting the Category
const deleteCategory = async (req,res)=>{
    try{
        const cid = req.query.cid;
        if(!cid){
            return res.status(400).json({success:false,message:"Category ID not provided"});
        }
        // Find the category by ID and delete it
        const category = await Category.findByIdAndDelete(cid);

        if(!category){
            return res.status(404).json({success:false,message:"Category not found"});
        }
        res.redirect('/admin/adminlistcategory');
    }catch(error){
        console.log("Delete category error:",error);
        res.status(500).json({success:false,message:"Internal Server Error"});
    }
};

//----------------------  controller func for soft Delete
const softDeleteCategory = async (req,res)=>{
    try{
        const cid = req.body.cid;
        
        const category = await Category.findById({_id:cid});
        if(category.isListed){
            await Category.findByIdAndUpdate(cid,{isListed:false});
            res.status(200).json({Listed:true});
        }else{
            await Category.findByIdAndUpdate(cid,{isListed:true});
            res.status(200).json({unListed:true});
        }
    }catch(error){
        console.log(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}






module.exports = {
    listCategoryPage,
    addnewCategory,
    updateCategoryPage,
    updateCategory,
    deleteCategory,
    softDeleteCategory
}