import { files, folders } from "../db/schema.ts";
import { db } from "../configs/db.ts";
import { and, asc, desc, eq, like, sql } from "drizzle-orm";

export interface FileCreatePayload {
  ownerId: string;
  fileName: string;
  fileKey: string;
  fileSize: number;
  fileType: string;
  folderId?: string;
  expiresAt?: Date;
}

export interface FileSort {
  column: string;
  direction: "asc" | "desc";
}

export interface FileUpdatePayload {
  fileName?: string;
  fileKey?: string;
  fileSize?: number;
  fileType?: string;
  folderId?: string;
  expiresAt?: Date;
}

export class FilesService {
  public async getFile(id: number) {
    const result = await db
      .select()
      .from(files)
      .where(eq(files.id, id))
      .limit(1);
    return result.length > 0 ? result[0] : null;
  }

  public async createFile(payload: FileCreatePayload) {
    const result = await db
      .insert(files)
      .values(payload)
      .returning();
    return result[0];
  }

  public async updateFile(id: number, payload: FileUpdatePayload) {
    const result = await db
      .update(files)
      .set({ ...payload })
      .where(eq(files.id, id))
      .returning();
    return result[0];
  }

  public async deleteFile(id: number) {
    const result = await db
      .delete(files)
      .where(eq(files.id, id));
    return result;
  }

  // public async getFiles(page: number, pageSize: number) {
  //   const offset = (page - 1) * pageSize;
  //   const filesList = await db
  //     .select()
  //     .from(files)
  //     .limit(pageSize)
  //     .offset(offset);
  //   const totalCountResult = await db
  //     .select({ count: sql`count(*)` })
  //     .from(files);
  //   const totalCount = totalCountResult[0]?.count ?? 0;
  //   return {
  //     files: filesList,
  //     totalCount,
  //     page,
  //     pageSize,
  //   };
  // }


  public async getFiles(
      page: number,
      pageSize: number,
      folderName?: string,
      sort?: FileSort,
      type?: string,
      ownerId?: string
    ) {
      const offset = (page - 1) * pageSize;
  
      // let whereClause = undefined;
  
      // if (folderName && type) {
      //   whereClause = and(
      //     like(folders.name, `%${folderName}%`),
      //     eq(files.fileType, type)
      //   );
      // } else if (folderName) {
      //   whereClause = like(folders.name, `%${folderName}%`);
      // } else if (type) {
      //   whereClause = eq(files.fileType, type);
      // }

      const conditions = [];

      if (folderName) {
        conditions.push(like(folders.name, `%${folderName}%`));
      }
      if (type) {
        conditions.push(eq(files.fileType, type));
      }
      if (ownerId) {
        conditions.push(eq(files.ownerId, ownerId));
      }
  
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  
      let orderByClause: any[] = [];
      
      if (sort) {
        const column = sort.column;
        const direction = sort.direction === "asc" ? asc : desc;
        if (column === "fileName") {
          orderByClause.push(direction(files.fileName));
        } else if (column === "fileSize") {
          orderByClause.push(direction(files.fileSize));
        } else if (column === "createdAt") {
          orderByClause.push(direction(files.createdAt));
        } else if (column === "id") {
          orderByClause.push(direction(files.id));
        }
      }

      // Fallback to default sorting if none provided
  if (orderByClause.length === 0) {
    orderByClause.push(desc(files.id));
  }
  
      const filesList = await db
        .select()
        .from(files)
        .leftJoin(folders, eq(files.folderId, folders.id))
        .where(whereClause)
        .orderBy(...orderByClause)
        .limit(pageSize)
        .offset(offset);
   
      const totalCountResult = await db
        .select({ count: sql`count(*)` })
        .from(files)
        .leftJoin(folders, eq(files.folderId, folders.id))
        .where(whereClause);
  
      const totalCount = totalCountResult[0]?.count ?? 0;
  
      return {
        files: filesList,
        totalCount,
        page,
        pageSize,
      };
    }

  
}
