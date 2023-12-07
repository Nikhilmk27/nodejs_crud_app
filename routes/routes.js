const express = require("express");
const router = express.Router();
const User = require("../models/users.js");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { runInContext } = require("vm");

// multer storage configeratin
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads"); //destination folder for uploded files
  },
  filename: function (req, file, cb) {
    // set unique file name for upladed images
    cb(null, Date.now() + path.extname(file.originalname)); // File naming logic
  },
});
// Initialize Multer with storage configuration
const upload = multer({ storage: storage }).single("image");

// admin log in page
router.get("/login", (req, res) => {
  if (req.session.admin) {
    res.redirect("/");
  } else {
    res.render("login", { title: "log in page" });
  }
});
router.post("/login", (req, res) => {
  try {
    const admins = [
      { password: 9526661686, email: "nikhil@123" },
      { password: 9526, email: "nikhil@9526" },
    ];
    const { email, password } = req.body;
    // check if email and password match
    const admin = admins.find(
      (admin) => admin.password == password && admin.email == email
    );
    if (!admin) {
      console.log("incirect credentials");
    } else {
      req.session.admin = req.body.email;
      res.redirect("/");
    }
  } catch (error) {
    console.log("error");
  }
});

// get all users from the database
router.get("/", async (req, res) => {
  if (req.session.admin) {
    try {
      const users = await User.find(); //fetch all users fom the User collection
      res.render("index", { title: "home page", users: users });
    } catch (error) {
      console.log(error.message);
      req.session.message = "error fetching users";
      res.json({ message: err.message });
    }
  } else {
    res.redirect("/");
  }
});
router.get("/add_user", (req, res) => {
    if(req.session.admin){
        res.render("adduser", { title: "adduser" });
    } else {
        res.redirect('/login')
    }
 
});
router.post("/add_user", upload, async (req, res) => {
  const { name, email, phone } = req.body;

  try {
    // check if any field alredy exist in the user collection
    const existingUser = await User.findOne({
      $or: [{ name }, { email }, { phone }, { image: req.file.filename }],
    });
    console.log(existingUser);
    if (existingUser) {
      req.session.message = "User already exists";
      res.redirect("/add_user");
    } else {
      const user = await User.create({
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        image: req.file.filename,
      });
      req.session.message = "user added sucessfully";
      console.log(user);
      res.redirect("/");
    }
  } catch (error) {
    console.log(error.message);
    req.session.message = "error ading user";
    res.redirect("/add_user");
  }
});

router.get("/edit/:id", async (req, res) => {
  if (req.session.admin) {
    try {
      let id = req.params.id;
      const user = await User.findOne({ _id: id });
      if (user) {
        console.log(user);
        res.render("edit", { title: "edituser", user });
      } else {
        console.log("User not found");
        res.redirect("/");
      }
    } catch (error) {
      console.error(error.message);
    }
  } else {
    res.redirect("/login");
  }
});

// update user details route
router.post("/update/:id", upload, async (req, res) => {
  if (req.session.admin) {
    let id = req.params.id;
    let new_image = "";

    if (req.file) {
      new_image = req.file.filename;
      try {
        fs.unlinkSync("./uploads/" + req.body.oldimage);
      } catch (error) {
        console.log(error);
      }
    } else {
      new_image = req.body.oldimage;
    }
    const updateData = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      image: new_image,
    };

    // Update the user document
    const updatedUser = await User.updateOne(
      { _id: id },
      { $set: updateData }
    ).then((result) => {
      console.log(result); // Log the result of the update operation
      res.redirect("/");
    });
  } else {
    res.redirect("/login");
  }
});
router.get("/delete/:id", async (req, res) => {
  let id = req.params.id;

  if (req.session.admin) {
    try {
      let user = await User.findOne({ _id: id });
      let imageFilename = user.image;
      console.log(imageFilename);
      await User.deleteOne({ _id: id }).then((deletedUser) => {
        console.log("User deleted:", deletedUser);
      });
      // delete the associated image

      const imagePath = path.join(__dirname, "../", "uploads", imageFilename);

      console.log(imagePath);
      fs.unlink(imagePath, (err) => {
        if (err) {
          console.error("Error deleting image:", err);
        } else {
          console.log("Image deleted successfully.");
        }
      });
      res.redirect("/");
    } catch (error) {
      console.log(error);
    }
  } else {
    res.redirect("/login");
  }
});

module.exports = router;
