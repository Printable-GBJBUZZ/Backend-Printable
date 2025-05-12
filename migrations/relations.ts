import { relations } from "drizzle-orm/relations";
import { users, orders, merchants, signatureRequests, folders, reviews, signatureStatus, files, signRequestedFiles } from "./schema";

export const ordersRelations = relations(orders, ({one}) => ({
	user: one(users, {
		fields: [orders.userId],
		references: [users.id]
	}),
	merchant: one(merchants, {
		fields: [orders.merchantId],
		references: [merchants.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	orders: many(orders),
	merchants: many(merchants),
	signatureRequests: many(signatureRequests),
	folders: many(folders),
	reviews: many(reviews),
	files: many(files),
}));

export const merchantsRelations = relations(merchants, ({one, many}) => ({
	orders: many(orders),
	user: one(users, {
		fields: [merchants.userId],
		references: [users.id]
	}),
	reviews: many(reviews),
}));

export const signatureRequestsRelations = relations(signatureRequests, ({one, many}) => ({
	user: one(users, {
		fields: [signatureRequests.requestedBy],
		references: [users.id]
	}),
	signatureStatuses: many(signatureStatus),
	signRequestedFiles: many(signRequestedFiles),
}));

export const foldersRelations = relations(folders, ({one, many}) => ({
	user: one(users, {
		fields: [folders.ownerId],
		references: [users.id]
	}),
	folder: one(folders, {
		fields: [folders.parentId],
		references: [folders.id],
		relationName: "folders_parentId_folders_id"
	}),
	folders: many(folders, {
		relationName: "folders_parentId_folders_id"
	}),
	files: many(files),
}));

export const reviewsRelations = relations(reviews, ({one}) => ({
	user: one(users, {
		fields: [reviews.userId],
		references: [users.id]
	}),
	merchant: one(merchants, {
		fields: [reviews.merchantId],
		references: [merchants.id]
	}),
}));

export const signatureStatusRelations = relations(signatureStatus, ({one}) => ({
	signatureRequest: one(signatureRequests, {
		fields: [signatureStatus.requestId],
		references: [signatureRequests.id]
	}),
}));

export const signRequestedFilesRelations = relations(signRequestedFiles, ({one}) => ({
	file: one(files, {
		fields: [signRequestedFiles.fileId],
		references: [files.id]
	}),
	signatureRequest: one(signatureRequests, {
		fields: [signRequestedFiles.requestId],
		references: [signatureRequests.id]
	}),
}));

export const filesRelations = relations(files, ({one, many}) => ({
	signRequestedFiles: many(signRequestedFiles),
	user: one(users, {
		fields: [files.ownerId],
		references: [users.id]
	}),
	folder: one(folders, {
		fields: [files.folderId],
		references: [folders.id]
	}),
}));