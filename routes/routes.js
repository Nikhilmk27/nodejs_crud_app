const express = require('express')
const router = express.Router()
const User = require('../models/users.js')
const multer = require('multer')
const path = require('path');
const fs = require('fs')

// multer storage configeratin
const storage = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null,'./uploads') //destination folder for uploded files
    },
    filename: function(req,file,cb){
        // set unique file name for upladed images
        cb(null, Date.now() + path.extname(file.originalname)); // File naming logic
    }

})
// Initialize Multer with storage configuration
const upload = multer({ storage: storage }).single('image');

// get all users from the database
router.get('/',async(req,res) => {
    try {
        const users = await User.find(); //fetch all users fom the User collection 
        res.render('index',{title:'home page',users:users})
        
    } catch (error) {
        console.log(error.message)
        req.session.message = 'error fetching users'
        res.json({message: err.message})
        
    }
   
})
router.get('/add_user',(req,res) => {
    res.render('adduser',{title:'adduser'})
})
router.post('/add_user',upload,async(req,res) => {
    try {
        const user =  await User.create({
            name:req.body.name,
            email:req.body.email,
            phone:req.body.phone,
            image:req.file.filename
        })
        req.session.message = 'user added sucessfully'
        console.log(user)
        res.redirect('/')
        
    } catch (error) {
       console.log(error.message) 
       req.session.message = 'error ading user'
       res.redirect('/add_user')
    }
    
   

})

router.get("/edit/:id",async(req,res) => {
    
    try {
        let id = req.params.id
        const user = await User.findOne({ _id: id });
        if (user) {
          console.log(user);
          res.render('edit',{title:"edituser",user})
        } else {
         
          console.log('User not found');
          res.redirect('/')
        }
      } catch (error) {
       
        console.error(error.message);
      }
    
   
    
})

// update user details route
router.post('/update/:id',upload,async (req,res) => {
    let id = req.params.id
    let new_image = ''
    if(req.file){
        new_image = req.file.filename
        try {
            fs.unlinkSync('./uploads/'+ req.body.oldimage)
            
        } catch (error) {
            console.log(error)
        }
    } else{
        new_image = req.body.oldimage
    }
    const updateData = {
        name:req.body.name,
        email:req.body.email,
        phone:req.body.phone,
        image:new_image
      };
      
      // Update the user document
     const updatedUser= await User.updateOne({ _id: id }, { $set: updateData })
        .then(result => {
          console.log(result); // Log the result of the update operation
          res.redirect('/')
         
        });

})
router.get('/delete/:id',async (req,res) => {
    let id = req.params.id

    try {
        
        let user = await User.findOne({_id:id})
        let imageFilename = user.image
        console.log(imageFilename)
        await User.deleteOne({_id:id})
        .then(deletedUser => {
            console.log('User deleted:', deletedUser);})
            // delete the associated image
            
            const imagePath = path.join(__dirname,'../', 'uploads', imageFilename);
            
             console.log (imagePath)
            fs.unlink(imagePath, err => {
              if (err) {
                console.error('Error deleting image:', err);
              } else {
                console.log('Image deleted successfully.');
              }})
              res.redirect('/')
        
        
    } catch (error) {
        console.log(error)
    }

})




module.exports = router