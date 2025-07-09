import { db } from "../configs/db.ts";
import { users, orders, merchants } from "../db/schema.ts";
import { eq, like, sql } from "drizzle-orm";

export interface UserManagementResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joinDate: Date;
  orders: number;
}

export class UserManagementService {
  public async searchUsers(query: string): Promise<UserManagementResponse[]> {
    const result = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: sql<string>`'user'`.as("role"),
        status: sql<string>`CASE WHEN EXISTS (SELECT 1 FROM ${orders} WHERE ${orders.userId} = ${users.id} AND ${orders.status} = 'pending') THEN 'Pending' ELSE 'Completed' END`.as("status"),
        joinDate: users.createdAt,
        orders: sql<number>`(SELECT COUNT(*) FROM ${orders} WHERE ${orders.userId} = ${users.id})`.as("orders"),
      })
      .from(users)
      .where(like(users.name, `%${query}%`))
      .limit(10);

    return result;
  }

  public async filterUsersByStatus(status: string): Promise<UserManagementResponse[]> {
    const result = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: sql<string>`'user'`.as("role"),
        status: sql<string>`CASE WHEN EXISTS (SELECT 1 FROM ${orders} WHERE ${orders.userId} = ${users.id} AND ${orders.status} = 'pending') THEN 'Pending' ELSE 'Completed' END`.as("status"),
        joinDate: users.createdAt,
        orders: sql<number>`(SELECT COUNT(*) FROM ${orders} WHERE ${orders.userId} = ${users.id})`.as("orders"),
      })
      .from(users)
      .where(sql`EXISTS (SELECT 1 FROM ${orders} WHERE ${orders.userId} = ${users.id} AND ${orders.status} = ${status})`)
      .limit(10);

    return result;
  }

  public async getUsers(): Promise<UserManagementResponse[]> {
    const result = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: sql<string>`'user'`.as("role"),
        status: sql<string>`CASE WHEN EXISTS (SELECT 1 FROM ${orders} WHERE ${orders.userId} = ${users.id} AND ${orders.status} = 'pending') THEN 'Pending' ELSE 'Completed' END`.as("status"),
        joinDate: users.createdAt,
        orders: sql<number>`(SELECT COUNT(*) FROM ${orders} WHERE ${orders.userId} = ${users.id})`.as("orders"),
      })
      .from(users)
      .limit(10);

    return result;
  }
}