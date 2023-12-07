import express from "express"; 
import {isAuthenticated} from "../middlewares/auth.js"
import {buySubscription, paymentVerification, getRazorPayKey, cancelSubscription} from "../controllers/paymentController.js"
const router = express.Router();

router.route("/subscribe").get(isAuthenticated, buySubscription);
router.route("/paymentverification").post(isAuthenticated, paymentVerification);
router.route("/getrazorpaykey").get(getRazorPayKey);
router.route("/subscribe/cancel").delete(isAuthenticated, cancelSubscription);

export default router;