import express from "express";
import { auth } from "../middleware/auth.js";
import { checkout, listOrders } from "../controllers/orderController.js";

const router = express.Router();
router.use(auth); // todas exigem token

router.post("/checkout", checkout);
router.get("/", listOrders);

export default router;
