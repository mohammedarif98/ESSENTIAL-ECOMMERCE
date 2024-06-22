
const multer = require('multer');
const path = require('path');


// Filter function to accept only image files
// const imageFilter = (req, file, cb) => {
//     if (!file.originalname.match(/\.(jpg|jpeg|png|gif|avif)$/)) {
//         return cb(new Error('Only image files are allowed!'),false);
//     }
//     cb(null, true);
// };

//------------------ multer configration for user image
const usreImageStorage = multer.diskStorage({
    destination:(req,file,cb) => {
        return cb(null,path.join(__dirname,"../public/user/asset/img/userImage"));
    },
    filename: (req,file,cb) => {
        return cb(null,`${Date.now()} - ${file.originalname}`);
    },
});

const userImageUpload = multer({ storage : usreImageStorage });

//------------------ Multer configuration for product
const productStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      return cb(null, path.join(__dirname, "../public/admin/asset/img/product"));
    },
    filename: (req, file, cb) => {
      return cb(null,`${Date.now()} - ${file.originalname}`);
    },
});
const productUpload = multer({ storage: productStorage });



module.exports = {
    userImageUpload,
    productUpload
}