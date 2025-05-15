import { eq } from "drizzle-orm";
import { db } from "../configs/db.ts";
import { files, folders } from "../db/schema.ts";
export interface FolderPayload {
  name: string;
  ownerId: string;
}
interface FileEntry {
  fileId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}
export interface FolderRename {
  folderId: string;
  newName: string;
}

interface FolderGroup {
  folderId: string | null;
  folderName: string;
  files: FileEntry[];
}

export class FileManager {
  constructor() {}
  //asign a file to a folder
  async assignFolderToFile(payload: { fileId: string; folderId: string }) {
    return await db
      .update(files)
      .set({ folderId: payload.folderId })
      .where(eq(files.id, payload.fileId));
  }
  async renameFolder(payload: FolderRename) {
    return await db
      .update(folders)
      .set({ name: payload.newName })
      .where(eq(folders.id, payload.folderId));
  }
  async createFolder(payload: FolderPayload) {
    const id = crypto.randomUUID();
    return await db.insert(folders).values({ id, ...payload });
  }
  async deleteFolder(payload: { folderId: string }) {
    return await db.delete(folders).where(eq(folders.id, payload.folderId));
  }
  async getFiles(payload: { ownerId: string }) {
    const result = await db
      .select({
        fileId: files.id,
        fileName: files.fileName,
        fileUrl: files.fileKey,
        fileType: files.fileType,
        fileSize: files.fileSize,
        folderName: folders.name,
        folderId: folders.id,
      })
      .from(files)
      .leftJoin(folders, eq(files.folderId, folders.id))
      .where(eq(files.ownerId, payload.ownerId));

    const folderMap = new Map<string | null, FolderGroup>();
    for (const file of result) {
      const folderId = file.folderId ?? null;
      const folderName = file.folderName ?? "Root";

      if (!folderMap.has(file.folderId)) {
        folderMap.set(file.folderId, { folderId, folderName, files: [] });
      }
      const payload: FileEntry = {
        fileId: file.fileId,
        fileName: file.fileName,
        fileUrl: file.fileUrl,
        fileType: file.fileType,
        fileSize: file.fileSize,
      };
      folderMap.get(file.folderId)!.files.push(payload);
    }
    return Array.from(folderMap.values());
  }
}
