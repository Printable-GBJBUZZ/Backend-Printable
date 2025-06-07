import {
  files,
  signatureStatus,
  signRequestedFiles,
  signRequests,
  users,
} from "../db/schema.ts";
import "jsr:@std/dotenv/load";
import { createHash } from "node:crypto";

import { and, eq, inArray, sql } from "drizzle-orm";
function calculateFileHash(payload: string): string {
  const hash = createHash("sha256");
  hash.update(payload);
  return hash.digest("hex");
}

//for transcation query
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
const pool = new Pool({
  connectionString: Deno.env.get("DATABASE_URL"),
});
const db = drizzle({ client: pool });
export interface Signee {
  Id: string;
  Email: string | null;
  signId: string | null;
  signedStatus: string | null;
  signedAt: string | null;
}

export interface SignRecordStatusPayload {
  fileId: string;
  fileName: string | null;
  status: string | null;
  signees: Signee[];
  createdAt: string | null;
  signedAt: string | null;
  fileUrl: string | null;
}

export interface esignRequestPayload {
  requestedBy: number;
  fileIds: number[];
  signers_email: string[];
  link: string;
}

export interface FilePayload {
  id: string;
  ownerId: string;
  fileName: string;
  fileKey: string;
  fileSize: number;
  fileType: string;
  fileHash: string;
}
export interface EmailPayload {
  from: string;
  to: string[];
  subject: string;
  html: string;
}
export class EsignService {
  constructor() {}

  async createFile(payload: FilePayload) {
    return await db
      .insert(files)
      .values({
        ...payload,
      })
      .returning();
  }
  async deleteFile(payload: { fileId: string; ownerId: string }) {
    return await db
      .delete(files)
      .where(
        and(eq(files.id, payload.fileId), eq(files.ownerId, payload.ownerId))
      );
  }

  async getSignId(userId: string) {
    const result = await db
      .select({ signId: users.signId })
      .from(users)
      .where(eq(users.signId, userId));
    return result[0];
  }

  async signeeSignedDocument(payload: { fileId: string; signeeId: string }) {
    // Get the user by email (for verification)
    console.log(payload.fileId, payload.signeeId);
    const [user] = await db
      .select({ id: users.id, email: users.email, signId: users.signId })
      .from(users)
      .where(eq(users.id, payload.signeeId))
      .limit(1);

    if (!user) {
      return {
        msg: "Not a valid signee.",
        success: false,
      };
    }
    const signatureStatusIdsToUpdate = await db
      .select({
        signatureStatusId: signatureStatus.id,
      })
      .from(files)
      .innerJoin(signRequestedFiles, eq(files.id, signRequestedFiles.fileId))
      .innerJoin(
        signRequests,
        eq(signRequestedFiles.requestId, signRequests.id)
      )
      .innerJoin(
        signatureStatus,
        eq(signatureStatus.requestId, signRequests.id)
      )
      .where(
        and(eq(files.id, payload.fileId), eq(signatureStatus.email, user.email))
      );
    for (const signStatus of signatureStatusIdsToUpdate) {
      await db
        .update(signatureStatus)
        .set({
          signatureKey: calculateFileHash(
            `signed through printable platform date:${new Date()} signId:${
              user.signId
            }`
          ),
          signId: user.signId,
          status: "signed",
          signedAt: new Date(),
        })
        .where(eq(signatureStatus.id, signStatus.signatureStatusId));
    }

    // check if request_id associated with fileId has all signed
    //get request id based on fileId
    const [{ requestId }] = await db
      .select({ requestId: signRequestedFiles.requestId })
      .from(signRequestedFiles)
      .where(eq(signRequestedFiles.fileId, payload.fileId));
    //check if all signee  had signed? and update requestId status if all signee signed that document
    if (await this.areAllSigned(requestId)) {
      await db
        .update(signRequests)
        .set({ status: "completed" })
        .where(eq(signRequests.id, requestId));
    }

    return {
      message: "Document signed successfully!.",
      success: true,
    };
  }
  async areAllSigned(requestId: number): Promise<boolean> {
    const result = await db
      .select({
        allSigned: sql<boolean>`bool_and(${signatureStatus.status} = 'signed')`,
      })
      .from(signatureStatus)
      .where(eq(signatureStatus.requestId, requestId));

    return result[0]?.allSigned ?? false;
  }

  async isValidSigner(payload: { signer_userId: string; fileId: string }) {
    // Get the user email associated with signer_userId
    const [user] = await db
      .select({ email: users.email, signId: users.signId })
      .from(users)
      .where(eq(users.id, payload.signer_userId))
      .limit(1);

    if (!user) {
      throw new Error(
        "User not found for signer_userId: " + payload.signer_userId
      );
    }

    // Check if the viewer is the owner
    const [owner] = await db
      .select({ id: files.ownerId })
      .from(files)
      .where(eq(files.id, payload.fileId))
      .limit(1);

    if (!owner) {
      throw new Error("File not found for fileId: " + payload.fileId);
    }

    const signId = user.signId;
    const email = user.email;

    let info;

    if (owner.id === payload.signer_userId) {
      info = await db
        .select({
          fileName: files.fileName,
          createdAt: signRequests.createdAt,
          signeeSignStatus: signatureStatus.status,
          signeeEmail: signatureStatus.email,
          signedAt: signatureStatus.signedAt,
          signId: signatureStatus.signId,
          ownerId: files.ownerId,
        })
        .from(files)
        .innerJoin(signRequestedFiles, eq(files.id, signRequestedFiles.fileId))
        .innerJoin(
          signRequests,
          eq(signRequestedFiles.requestId, signRequests.id)
        )
        .innerJoin(
          signatureStatus,
          eq(signatureStatus.requestId, signRequests.id)
        )
        .where(eq(files.id, payload.fileId));
    } else {
      info = await db
        .select({
          fileName: files.fileName,
          signeeSignStatus: signatureStatus.status,
          signeeEmail: signatureStatus.email,
          signedAt: signatureStatus.signedAt,
          signId: signatureStatus.signId,
        })
        .from(files)
        .innerJoin(signRequestedFiles, eq(files.id, signRequestedFiles.fileId))
        .innerJoin(
          signRequests,
          eq(signRequestedFiles.requestId, signRequests.id)
        )
        .innerJoin(
          signatureStatus,
          eq(signatureStatus.requestId, signRequests.id)
        )
        .where(
          and(eq(files.id, payload.fileId), eq(signatureStatus.email, email))
        );
    }

    // Simplified query to avoid recursion
    const [result] = await db
      .select({
        fileUrl: files.fileKey,
        email: signatureStatus.email,
        status: signatureStatus.status,
      })
      .from(files)
      .innerJoin(signRequestedFiles, eq(files.id, signRequestedFiles.fileId))
      .innerJoin(
        signatureStatus,
        eq(signRequestedFiles.requestId, signatureStatus.requestId)
      )
      .where(eq(files.id, payload.fileId))
      .limit(1);

    if (!result) {
      throw new Error(
        "No matching signature status found for fileId: " + payload.fileId
      );
    }

    const response = {
      fileUrl: result.fileUrl,
      view: true,
      sign: result.email === user.email,
      status: result.status,
      signId: user.signId,
    };

    if (info.length > 0) {
      return { ...response, info };
    }

    return response;
  }

  async getSignRecordsForUser(
    userId: string
  ): Promise<SignRecordStatusPayload[]> {
    const records = await db
      .select({
        //file status data with some parameter
        fileId: files.id,
        fileName: files.fileName,
        fileUrl: files.fileKey,
        requestId: signRequestedFiles.requestId,
        createdAt: signRequests.createdAt,
        status: signRequests.status,
        //signee signed status data
        signees: {
          id: signatureStatus.id,
          email: signatureStatus.email,
          signId: signatureStatus.signId,
          status: signatureStatus.status,
          signedAt: signatureStatus.signedAt,
        },
      })
      .from(signRequestedFiles)
      .leftJoin(files, eq(signRequestedFiles.fileId, files.id))
      .leftJoin(signRequests, eq(signRequestedFiles.requestId, signRequests.id))
      .leftJoin(signatureStatus, eq(signatureStatus.requestId, signRequests.id))
      .where(eq(signRequests.requestedBy, userId)); // Filter by the owner of file who created the sign request
    if (records.length === 0) {
      return [];
    }
    const grouped: Record<string, SignRecordStatusPayload> = {};

    for (const row of records) {
      const key = `${row.fileId}-${row.requestId}`;

      if (!grouped[key]) {
        grouped[key] = {
          fileId: row.fileId as string,
          fileName: row.fileName ?? null,
          fileUrl: row.fileUrl ?? null,
          createdAt: row.createdAt ? row.createdAt.toISOString() : null,
          signedAt: row.signees?.signedAt
            ? row.signees.signedAt.toISOString()
            : null,
          status: row.status ?? null,
          signees: [],
        };
      }

      // Add the signee information
      if (row.signees) {
        grouped[key].signees.push({
          Id: String(row.signees.id),
          Email: row.signees.email ?? null,
          signId: row.signees.signId ?? null,
          signedStatus: row.signees.status ?? null,
          signedAt: row.signees.signedAt
            ? row.signees.signedAt.toISOString()
            : null,
        });
      }
    }

    return Object.values(grouped);
  }
  async sendSigningRequest(payload: esignRequestPayload) {
    const id = crypto.randomUUID();
    // check if requested user is the owner of file or not
    const response = await db
      .select()
      .from(files)
      .where(
        and(
          inArray(files.id, payload.fileIds),
          eq(files.ownerId, payload.requestedBy)
        )
      );
    console.log(payload);
    if (response.length === 0) {
      return {
        msg: "Not eligible to send sign request",
        success: false,
      };
    }
    console.log("user is owner", payload);
    const res = await db.transaction(async (tx) => {
      // create signRequest record in signRequest table
      const [signRequest] = await tx
        .insert(signRequests)
        .values({
          requestedBy: payload.requestedBy,
          status: "pending",
        })
        .returning({ id: signRequests.id });

      const fileEntries = payload.fileIds.map((fileId) => ({
        fileId,
        requestId: signRequest.id,
      }));
      console.log("created record in db", signRequest);
      // console.log(fileEntries);
      // create entry within signRequestFiles of newSignRequests

      await tx.insert(signRequestedFiles).values(fileEntries);
      console.log("signRequest file inserted");

      const signatureEntries = payload.signers_email.map((email) => {
        return {
          requestId: signRequest.id,
          email, // store email if unregistered
          status: "pending",
        };
      });

      await tx.insert(signatureStatus).values(signatureEntries);

      return true;
    });
    console.log("response", res);

    if (res) {
      // send email to all mentioned signee email
      const mail_payload = {
        from: "Acme <noreply@gbjbuzz.com>",
        to: payload.signers_email,
        subject: "Sign Request Mail",
        html: `<h1>it works!
link: ${payload.link}
        </h1>`,
      };

      return await this.sendSignRequestEmail(mail_payload);
    }
  }

  async sendSignRequestEmail(email_data: EmailPayload) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("RESEND_API")}`,
      },
      body: JSON.stringify(email_data),
    });
    console.log(res);

    const data = await res.json();
    if (res.ok) {
      console.log("done sending email");
      console.log(data);

      return { msg: "email sent sucessfully", success: true };
    }
    return { msg: "Failed sending Email, try again !!", success: false };
  }
  async updateFile(payload: any, fileId: number) {
    await db
      .update(files)
      .set({
        ...payload,
      })
      .where(eq(files.id, fileId));

    return { msg: "File Saved Successfully", success: true };
  }
  async deleteRequestedDocument() {}
}
