import express from "express"
const router = express.Router();
import {getAllCourses, createPost, getCourseLectures, addLecture, deleteCourse, deleteLecture} from "../controllers/courseController.js";
import singleUpload from "../middlewares/multer.js";
import {authorizeAdmin} from "../middlewares/auth.js";
import {isAuthenticated} from "../middlewares/auth.js"
import {authorizeSubscribers} from "../middlewares/auth.js"
router.route("/courses").get(getAllCourses);
router.route("/createcourse").post(isAuthenticated, authorizeAdmin, singleUpload, createPost);
router.route("/course/:id").get(isAuthenticated, authorizeSubscribers, getCourseLectures).post(isAuthenticated, authorizeAdmin, singleUpload, addLecture).delete(isAuthenticated, authorizeAdmin, deleteCourse);
router.route("/lecture").delete(isAuthenticated, authorizeAdmin, deleteLecture);
export default router;