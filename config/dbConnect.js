
const mongoose = require('mongoose');

const dbConnect = async()=>{
    try{
        await mongoose.connect(process.env.MONGODB_URL);
        console.log(`database connected`);
    }catch(error){
        console.log("database error");
        process.exit(1)  //application exits with a status code of 1, indicating an error.
    }
} 


module.exports = dbConnect