import { db } from "../configs/db.ts";
import { users, orders } from "../db/schema.ts";
import { eq, like, sql } from "drizzle-orm";

export interface UserManagementResponse {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  state: string | null;
  city: string | null;
  signId: string;
  address: string | null;
  latitude: string | null;
  longitude: string | null;
  updatedAt: Date;
  createdAt: Date;
  role: string;
  status: string;
  orders: number;
}

export interface SignupPayload {
  name: string;
  email: string;
  phone?: string;
}

export class UserManagementService {
  public async searchUsers(query: string): Promise<UserManagementResponse[]> {
    const result = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        state: users.state,
        city: users.city,
        signId: users.signId,
        address: users.address,
        latitude: users.latitude,
        longitude: users.longitude,
        updatedAt: users.updatedAt,
        createdAt: users.createdAt,
        role: sql<string>`'user'`.as("role"),
        status: sql<string>`CASE WHEN EXISTS (SELECT 1 FROM ${orders} WHERE ${orders.userId} = ${users.id} AND ${orders.status} = 'pending') THEN 'Pending' ELSE 'Completed' END`.as("status"),
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
        phone: users.phone,
        state: users.state,
        city: users.city,
        signId: users.signId,
        address: users.address,
        latitude: users.latitude,
        longitude: users.longitude,
        updatedAt: users.updatedAt,
        createdAt: users.createdAt,
        role: sql<string>`'user'`.as("role"),
        status: sql<string>`CASE WHEN EXISTS (SELECT 1 FROM ${orders} WHERE ${orders.userId} = ${users.id} AND ${orders.status} = 'pending') THEN 'Pending' ELSE 'Completed' END`.as("status"),
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
        phone: users.phone,
        state: users.state,
        city: users.city,
        signId: users.signId,
        address: users.address,
        latitude: users.latitude,
        longitude: users.longitude,
        updatedAt: users.updatedAt,
        createdAt: users.createdAt,
        role: sql<string>`'user'`.as("role"),
        status: sql<string>`CASE WHEN EXISTS (SELECT 1 FROM ${orders} WHERE ${orders.userId} = ${users.id} AND ${orders.status} = 'pending') THEN 'Pending' ELSE 'Completed' END`.as("status"),
        orders: sql<number>`(SELECT COUNT(*) FROM ${orders} WHERE ${orders.userId} = ${users.id})`.as("orders"),
      })
      .from(users)
      .limit(10);

    return result;
  }

  public async signupUser(payload: SignupPayload): Promise<UserManagementResponse> {
    const { name, email, phone } = payload;

    if (!name || !email) {
      throw new Error("Name and email are required");
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      throw new Error("Invalid email format");
    }

    const id = crypto.randomUUID();
    const signId = crypto.randomUUID(); // Generate unique signId
    const createdAt = new Date();
    const result = await db
      .insert(users)
      .values({ id, name, email, phone, signId, createdAt, updatedAt: createdAt })
      .returning();

    const user = result[0];
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      state: user.state,
      city: user.city,
      signId: user.signId,
      address: user.address,
      latitude: user.latitude,
      longitude: user.longitude,
      updatedAt: user.updatedAt,
      createdAt: user.createdAt,
      role: "user",
      status: "Pending",
      orders: 0,
    };
  }
}