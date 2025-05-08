import {
  index,
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  jsonb,
  foreignKey,
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
  signId: text("sign_id").unique(),
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

  fulfillmentType: text("fulfillment_type").default("delivery").notNull(), // "takeaway" or "delivery"

  // Optional delivery address fields (if not taking away)
  state: text("state"),
  city: text("city"),
  address: text("address"),
  latitude: text("latitude"),
  longitude: text("longitude"),

  // JSONB to store multiple documents and their print settings
  documents: jsonb("documents").notNull(),
});

// RELATIONS
export const merchantsRelations = relations(merchants, ({ many }) => ({
  orders: many(orders), // A merchant can have multiple orders
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  merchant: one(merchants, {
    fields: [orders.merchantId],
    references: [merchants.id],
  }),
}));

// EXAMPLE OF JSONB FOR DOCUMENTS COLUMN IN ORDERS TABLE
// [
//   {
//     "fileName": "assignment.pdf",
//     "fileUrl": "https://example.com/assignment.pdf",
//     "copies": 2,
//     "colorType": "color",
//     "paperType": "A4",
//     "printType": "front_and_back",
//     "pageDirection": "vertical"
//   },
//   {
//     "fileName": "notes.pdf",
//     "fileUrl": "https://example.com/notes.pdf",
//     "copies": 1,
//     "colorType": "black_and_white",
//     "paperType": "Letter",
//     "printType": "front",
//     "pageDirection": "horizontal"
//   }
// ]
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

export const signRequests = pgTable("signature_requests", {
  id: serial("id").primaryKey(),
  requestedBy: text("requested_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }), // Requested owner
  status: text("status").default("pending").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── FOLDERS ───────────────────────────────────────────────────────────────────
export const folders = pgTable(
  "folders",
  {
    // id TEXT PRIMARY KEY
    id: text("id").primaryKey(),

    // owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }), // :contentReference[oaicite:0]{index=0}

    // name TEXT NOT NULL
    name: text("name").notNull(),

    // parent_id TEXT REFERENCES folders(id) ON DELETE CASCADE
    parentId: text("parent_id").references(() => folders.id, {
      onDelete: "cascade",
    }), // :contentReference[oaicite:1]{index=1}

    // created_at TIMESTAMP DEFAULT now() NOT NULL
    createdAt: timestamp("created_at").defaultNow().notNull(),

    // updated_at TIMESTAMP DEFAULT now() NOT NULL
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

// Relation for the folders table
export const foldersRelations = relations(folders, ({ many }) => ({
  files: many(files),
}));
// Optional: relations so you can do folder.owner or folder.subfolders
export const folderRelations = relations(folders, ({ one, many }) => ({
  owner: one(users, {
    fields: [folders.ownerId],
    references: [users.id],
  }),
  parent: one(folders, {
    fields: [folders.parentId],
    references: [folders.id],
  }),
  subfolders: many(folders),
  // files: many(files),    // if you add a files.folderId FK
}));

export const signRequestedFiles = pgTable("sign_requested_files", {
  id: serial("id").primaryKey(),
  fileId: text("file_id")
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

  signId: text("sign_id").references(() => users.signId, {
    onDelete: "cascade",
  }), // Nullable for unregistered users

  email: text("email"), // Store email for unregistered users

  signatureKey: text("signature_key"), // Stores digital signature key (if signed)

  status: text("status").default("pending"), // "pending" | "signed"

  signedAt: timestamp("signed_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// one user can have multiple files
export const userFileRelations = relations(users, ({ many }) => ({
  files: many(files),
}));

// one user can have multiple sign requests
export const userSignRequestRelations = relations(users, ({ many }) => ({
  signRequests: many(signRequests),
}));
// one sign request can have multiple files
export const signRequestFileRelations = relations(signRequests, ({ many }) => ({
  files: many(signRequestedFiles),
}));

//one file can have multiple signatures
export const fileSignaturesRelations = relations(files, ({ many }) => ({
  signatures: many(signatureStatus),
}));
//one sign request can have multiple signature status
export const signRequestWithsignaturesRelations = relations(
  signRequests,
  ({ many }) => ({
    signatures: many(signatureStatus),
  })
);
export const reviews = pgTable(
  "reviews",
  {
    id: serial().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    merchantId: text("merchant_id").notNull(),
    rating: integer().notNull(),
    comment: text(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "reviews_user_id_users_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.merchantId],
      foreignColumns: [merchants.id],
      name: "reviews_merchant_id_merchants_id_fk",
    }).onDelete("cascade"),
  ]
);
