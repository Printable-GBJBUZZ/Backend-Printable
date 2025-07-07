import { AdminService } from "../services/adminService.ts";

const adminService = new AdminService();

export const getSystemStats = async (req: any, res: any, next: any) => {
  try {
    const stats = await adminService.getSystemStats();
    res.json({ success: true, stats });
  } catch (error: any) {
    console.error("Get system stats error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};