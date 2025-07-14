import express from "express";
import { auth } from "../middleware/auth.js";
import { addItem, getCart, removeItem } from "../controllers/cartController.js";

const router = express.Router();
router.use(auth); // todas exigem token

router.post("/items", addItem);
router.get("/", getCart);
router.delete("/items/:productId", removeItem);

export default router;
