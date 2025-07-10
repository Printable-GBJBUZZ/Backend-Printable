import { Request, Response, NextFunction } from "express";
import { UserManagementService } from "../services/userManagementService.ts";

const userManagementService = new UserManagementService();

export const searchUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = req.query.query as string || "";
    const users = await userManagementService.searchUsers(query);
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

export const filterUsersByStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const status = req.query.status as string || "";
    const users = await userManagementService.filterUsersByStatus(status);
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await userManagementService.getUsers();
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};