import { Request, Response, NextFunction } from "express";
import { BlogService, BlogCreatePayload } from "../services/blogService.ts";

export class BlogController {
  private blogService: BlogService;

  constructor() {
    this.blogService = new BlogService();
  }

  public async createBlog(req: Request, res: Response, next: NextFunction) {
    try {
      const body: BlogCreatePayload = req.body;

      // Validate payload
      if (!body.title || typeof body.title !== "string") {
        return res.status(400).json({ error: "Title is required and must be a string" });
      }
      if (!body.img || typeof body.img !== "string") {
        return res.status(400).json({ error: "Image URL is required and must be a string" });
      }
      if (!body.description || typeof body.description !== "string") {
        return res.status(400).json({ error: "Description is required and must be a string" });
      }
      if (!body.content || !Array.isArray(body.content) || !body.content.every((item: any) => typeof item.title === "string" && Array.isArray(item.bulletpoint) && item.bulletpoint.every((bp: any) => typeof bp === "string"))) {
        return res.status(400).json({ error: "Content is required and must be an array of {title: string, bulletpoint: string[]} objects" });
      }

      const newBlog = await this.blogService.createBlog(body);

      return res.status(201).json({
        message: "Blog created successfully",
        blog: newBlog,
      });
    } catch (error) {
      next(error);
    }
  }

  public async getAllBlogs(req: Request, res: Response, next: NextFunction) {
    try {
      const allBlogs = await this.blogService.getAllBlogs();
      return res.status(200).json(allBlogs);
    } catch (error) {
      next(error);
    }
  }
}