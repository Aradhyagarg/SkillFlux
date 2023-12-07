import express from "express"
import {authorizeAdmin, isAuthenticated} from "../middlewares/auth.js"
import {register, login, logout, getMyProfile, changePassword, updateProfile, updateProfilePicture, forgetPassword, resetPassword, addtoplaylist, removefromplaylist, getAllUsers, updateUserRole, deleteUser, deleteMyProfile} from "../controllers/userController.js"
import singleUpload from "../middlewares/multer.js";
const router = express.Router();

router.route("/register").post(singleUpload, register);
router.route("/login").post(login);
router.route("/logout").get(logout);
router.route("/getMyProfile").get(isAuthenticated, getMyProfile);
router.route("/deleteMyProfile").delete(isAuthenticated, deleteMyProfile);
router.route("/changePassword").put(isAuthenticated, changePassword);
router.route("/updateProfile").put(isAuthenticated, updateProfile);
router.route("/updateProfilePicture").put(isAuthenticated, singleUpload, updateProfilePicture);
router.route("/forgetPassword").post(forgetPassword);
router.route("/resetpassword/:token").put(resetPassword);
router.route("/addtoplaylist").post(isAuthenticated, addtoplaylist);
router.route("/removefromplaylist").delete(isAuthenticated, removefromplaylist);

//Admin Routes
router.route("/admin/users").get(isAuthenticated, authorizeAdmin, getAllUsers);
router.route("/admin/user/:id").put(isAuthenticated, authorizeAdmin, updateUserRole).delete(isAuthenticated, authorizeAdmin, deleteUser);
export default router;