import express from "express";
import multer from "multer";
import cloudinary, { deleteOldProfileImage } from "../helpers/cloudinaryHelper.js";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import {
  changePassword,
  forgotPassword,
  getUser,
  loginUser,
  logoutUser,
  registerUser,
  resetPassword,
  updateUser,
  userLoginStatus,
  verifyEmail,
  verifyUser,
  getUserById,
} from "../controllers/auth/userController.js";
import {
  adminMiddleware,
  creatorMiddleware,
  protect,
} from "../middleware/authMiddleware.js";
import {
  deleteUser,
  getAllUsers,
} from "../controllers/auth/adminController.js";

const router = express.Router();

// Cloudinary is already configured in cloudinaryHelper.js

// Configure multer with Cloudinary storage
let storage;
try {
  storage = new CloudinaryStorage({
    cloudinary: cloudinary.v2,
    params: {
      folder: "snippy-profiles",
      allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
      transformation: [
        { width: 400, height: 400, crop: "fill", gravity: "face" },
        { quality: "auto" },
      ],
    },
  });
  console.log("Cloudinary storage configured successfully");
} catch (error) {
  console.error("Error configuring Cloudinary storage:", error);
  throw new Error("Failed to configure Cloudinary storage: " + error.message);
}

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log("Processing file:", file.originalname, "MIME type:", file.mimetype);
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
}).single('photo');

// Error handling middleware for multer
const handleUpload = (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error("Multer error:", err);
      return res.status(400).json({ 
        message: "File upload error", 
        error: err.message 
      });
    } else if (err) {
      console.error("Upload error:", err);
      
      // Check for Cloudinary-specific errors
      if (err.message && err.message.includes('cloudinary')) {
        console.error("Cloudinary configuration error:", err);
        return res.status(500).json({ 
          message: "Image upload service error", 
          error: "Failed to upload image. Please try again later."
        });
      }
      
      return res.status(400).json({ 
        message: "File upload failed", 
        error: err.message 
      });
    }
    next();
  });
};

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/logout", logoutUser);
router.get("/user", protect, getUser);
router.patch("/user", protect, handleUpload, updateUser);

// get user by Id
router.get("/user/:id", getUserById);

// admin route
router.delete("/admin/users/:id", protect, adminMiddleware, deleteUser);

// get all users
router.get("/admin/users", protect, creatorMiddleware, getAllUsers);

// login status
router.get("/login-status", userLoginStatus);

// email verification
router.post("/verify-email", protect, verifyEmail);

// veriify user --> email verification
router.post("/verify-user/:verificationToken", verifyUser);

// forgot password
router.post("/forgot-password", forgotPassword);

//reset password
router.post("/reset-password/:resetPasswordToken", resetPassword);

// change password ---> user must be logged in
router.patch("/change-password", protect, changePassword);

export default router;
