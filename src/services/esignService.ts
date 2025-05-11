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

  async signeeSignedDocument(payload: { fileId: string; signeeEmail: string }) {
    // Get the user by email (for verification)
    console.log(payload.fileId, payload.signeeEmail);
    const [user] = await db
      .select({ id: users.id, email: users.email, signId: users.signId })
      .from(users)
      .where(eq(users.email, payload.signeeEmail))
      .limit(1);

    if (!user) {
      throw new Error("User not found or email does not match.");
    }

    //Find all signature requests linked to the fileId
    const signRequestsList = await db
      .select({
        requestId: signRequestedFiles.requestId,
        status: signRequests.status,
      })
      .from(files)
      .innerJoin(signRequestedFiles, eq(files.id, signRequestedFiles.fileId))
      .innerJoin(
        signRequests,
        eq(signRequestedFiles.requestId, signRequests.id)
      )
      .where(eq(files.id, payload.fileId));

    if (signRequestsList.length === 0) {
      throw new Error("No sign requests found for the file.");
    }

    //  Loop through all the sign requests and update signature statuses
    for (const signRequest of signRequestsList) {
      // Check if the signee has already signed the current request
      const [existingSignature] = await db
        .select({ status: signatureStatus.status })
        .from(signatureStatus)
        .where(
          eq(signatureStatus.requestId, signRequest.requestId),
          eq(signatureStatus.email, payload.signeeEmail)
        )
        .limit(1);

      if (existingSignature && existingSignature.status === "signed") {
        // Skip updating if the signee has already signed this request
        return { msg: "You have already signed!" };
      }

      // Update the signature status for the current request
      const updatedStatus = await db
        .update(signatureStatus)
        .set({
          signatureKey: calculateFileHash("i love sigining"),
          signId: user.signId,
          status: "signed",
          signedAt: new Date(),
        })
        .where(
          eq(signatureStatus.requestId, signRequest.requestId),
          eq(signatureStatus.email, payload.signeeEmail)
        );

      if (updatedStatus.count === 0) {
        throw new Error(
          `Failed to update signature status for request ${signRequest.requestId}.`
        );
      }

      // Check if all signees have signed this request
      const [signatureCounts] = await db
        .select({
          total: sql<number>`COUNT(*)`,
          signed: sql<number>`SUM(CASE WHEN ${signatureStatus.status} = 'signed' THEN 1 ELSE 0 END)`,
        })
        .from(signatureStatus)
        .where(eq(signatureStatus.requestId, signRequest.requestId));

      if (signatureCounts.total === signatureCounts.signed) {
        // All signees have signed; update request status
        await db
          .update(signRequests)
          .set({ status: "completed" })
          .where(eq(signRequests.id, signRequest.requestId));
      }
    }

    return {
      message: "Document signed successfully!.",
      success: true,
    };
  }

  async isValidSigner(payload: { signer_userId: string; fileId: string }) {
    // Get the user email associated with signer_userId
    const [user] = await db
      .select({ email: users.email, signId: users.signId })
      .from(users)
      .where(eq(users.id, payload.signer_userId))
      .limit(1);
    //check if the viewer is owner
    const owner = await db
      .select({ id: files.ownerId })
      .from(files)
      .where(eq(files.id, payload.fileId));

    let info;

    if (owner[0].id === payload.signer_userId) {
      //get the all signee along with sign request createAt and signedAt
      info = await db
        .select({
          fileName: files.fileName,
          createdAt: signRequests.createdAt,
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
        .where(eq(files.id, payload.fileId));
    } else {
      info = await db
        .select({
          fileName: files.fileName,
          signeeSignStatus: signatureStatus.status,
          signeeEmail: signatureStatus.email,
          signedAt: signatureStatus.signedAt,
          signId: user[0].signId,
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
          and(
            eq(files.id, payload.fileId),
            eq(user[0].email, signatureStatus.email) // <-- add your signee check here
          )
        );
    }

    // else proceed with checking if the user is a valid signer
    const result = await db
      .select({
        fileUrl: files.fileKey,
        view: sql<boolean>`true`.as("view"),
        sign: sql<boolean>`
        CASE 
          WHEN ${signatureStatus.email} = ${user.email} 
          THEN true 
          ELSE false 
        END
      `.as("sign"),
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
    if (info) return { ...result[0], signId: user.signId, info };

    return { ...result[0], signId: user.signId };
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
    if (response.length === 0) {
      return {
        status: 400,
        message: "Not eligible to send sign request",
      };
    }

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

    if (res) {
      // send email to all mentioned signee email
      const mail_payload = {
        from: "Acme <onboarding@resend.dev>",
        to: [payload.signers_email[payload.signers_email.length - 1]],
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
