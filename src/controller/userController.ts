import { Request, Response, NextFunction } from "express";
import { UserService, UserUpdatePayload } from "../services/userService.ts";
import { log } from "node:console";

const userService = new UserService();

export const getUserController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: "User ID is required" });
    }
    const user = await userService.getUser(id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    next(error);
  }
};

export const updateUserController = async (
  req: Request<{ id: string }, {}, UserUpdatePayload>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const payload = req.body;
    if (!id) {
      res.status(400).json({ error: "User ID is required" });
    }
    const updatedUser = await userService.updateUser({ ...payload }, id);
    if (!updatedUser) {
      res.status(404).json({ error: "User not found" });
    }
    res.status(200).json({
      message: "User updated successfully",
      updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    next(error);
  }
};

export const getNearestMerchants = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const long = parseFloat(req.query.long as string);

    if (isNaN(lat) || isNaN(long)) {
      res.status(400).json({ error: "Invalid latitude or longitude" });
    }

    const nearestMerchants = await userService.getNearestMerchants(
      lat.toString(),
      long.toString()
    );

    res.status(200).json(nearestMerchants);
  } catch (error) {
    console.error("Error finding nearest merchants:", error);
    next(error);
  }
};
