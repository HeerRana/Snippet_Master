import express from "express";
import multer from "multer";
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
  getProfilePhoto,
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
import {
  verifyLoginOtp,
  resendLoginOtp,
  setTwoFactor,
  googleLogin,
} from "../controllers/auth/authExtrasController.js";

const router = express.Router();

// Profile pictures are kept in memory and then saved to MongoDB by updateUser
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB (the browser resizes pictures before upload)
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
router.post("/login/verify-otp", verifyLoginOtp);
router.post("/login/resend-otp", resendLoginOtp);
router.post("/auth/google", googleLogin);
router.patch("/two-factor", protect, setTwoFactor);
router.get("/logout", logoutUser);
router.get("/user", protect, getUser);
router.patch("/user", protect, handleUpload, updateUser);

// get user by Id
router.get("/user/:id", getUserById);

// profile picture stored in MongoDB
router.get("/user/:id/photo", getProfilePhoto);

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
