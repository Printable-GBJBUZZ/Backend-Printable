import { Router } from "express";
import { BlogController } from "../controller/blogController.ts";

const router = Router();
const blogController = new BlogController();

// Create a new blog
router.post("/", (req, res, next) => blogController.createBlog(req, res, next));

// Get all blogs
router.get("/", (req, res, next) => blogController.getAllBlogs(req, res, next));

export default router;