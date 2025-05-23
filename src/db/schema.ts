import {
  index,
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").unique().notNull(),
  phone: text("phone").unique(),
  state: text("state"),
  city: text("city"),
  signId: text("sign_id").notNull().unique(),
  address: text("address"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const merchants = pgTable("merchants", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  shopName: text("shop_name").notNull(),
  shopImages: text("images")
    .array()
    .default(sql`ARRAY[]::text[]`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  merchantId: text("merchant_id").references(() => merchants.id, {
    onDelete: "cascade",
  }),
  status: text("status").default("pending").notNull(),
  totalAmount: integer("total_amount").notNull(),
  paymentMethod: text("payment_method").notNull(),
  scheduledPrintTime: timestamp("scheduled_print_time"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  fulfillmentType: text("fulfillment_type").default("delivery").notNull(),
  state: text("state"),
  city: text("city"),
  address: text("address"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  documents: jsonb("documents").notNull(),
});

export const signRequests = pgTable("signature_requests", {
  id: serial("id").primaryKey(),
  requestedBy: text("requested_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }), // Requested owner
  status: text("status").default("pending").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const files = pgTable("files", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, {
      onDelete: "cascade",
    }),
  fileName: text("file_name").notNull(),
  fileKey: text("file_key").notNull(), // file access url
  fileSize: integer("file_size").notNull(),
  fileType: text("file_type").notNull(),
  fileHash: text("file_hash").notNull(),
  folderId: text("folder_id").references(() => folders.id, {
    onDelete: "cascade",
  }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const folders = pgTable(
  "folders",
  {
    // id TEXT PRIMARY KEY
    id: text("id").primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    // CREATE INDEX ON folders(owner_id);
    index("folders_owner_id_idx").on(table.ownerId), // :contentReference[oaicite:2]{index=2}
  ]
);
export const filesRelations = relations(files, ({ one }) => ({
  folder: one(folders, {
    fields: [files.folderId],
    references: [folders.id],
  }),
}));

export const foldersRelations = relations(folders, ({ one, many }) => ({
  owner: one(users, {
    fields: [folders.ownerId],
    references: [users.id],
  }),
  files: many(files),
}));

export const signRequestedFiles = pgTable("sign_requested_files", {
  id: serial("id").primaryKey(),
  fileId: integer("file_id")
    .notNull()
    .references(() => files.id, {
      onDelete: "cascade",
    }),
  requestId: integer("request_id")
    .notNull()
    .references(() => signRequests.id, {
      onDelete: "cascade",
    }),
});

export const signatureStatus = pgTable("signature_status", {
  id: serial("id").primaryKey(),

  requestId: integer("request_id")
    .notNull()

    .references(() => signRequests.id, {
      onDelete: "cascade",
    }),

  signId: text("sign_id"), // Nullable for unregistered users

  email: text("email"), // Store email for unregistered users

  signatureKey: text("signature_key"), // Stores digital signature key (if signed)

  status: text("status").default("pending").notNull(), // "pending" | "signed"

  signedAt: timestamp("signed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  merchantId: text("merchant_id")
    .notNull()
    .references(() => merchants.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// RELATIONS
export const merchantsRelations = relations(merchants, ({ many }) => ({
  orders: many(orders),
  reviews: many(reviews),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  merchant: one(merchants, {
    fields: [orders.merchantId],
    references: [merchants.id],
  }),
}));

export const userFileRelations = relations(users, ({ many }) => ({
  files: many(files),
}));

export const userSignRequestRelations = relations(users, ({ many }) => ({
  signRequests: many(signRequests),
}));

export const signRequestFileRelations = relations(signRequests, ({ many }) => ({
  files: many(signRequestedFiles),
}));

export const fileSignaturesRelations = relations(files, ({ many }) => ({
  signatures: many(signatureStatus),
}));

export const signRequestWithsignaturesRelations = relations(
  signRequests,
  ({ many }) => ({
    signatures: many(signatureStatus),
  })
);

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  merchant: one(merchants, {
    fields: [reviews.merchantId],
    references: [merchants.id],
  }),
}));
