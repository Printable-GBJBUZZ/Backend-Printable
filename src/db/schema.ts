import {
  index,
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  jsonb,
  boolean,
  numeric,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";

export const chatMessages = pgTable("chat_messages", {
  id: text("id").primaryKey(),
  senderId: text("sender_id").notNull(),
  receiverId: text("receiver_id").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").unique().notNull(),
  phone: text("phone"),
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
  name: text("name").notNull(),
  email: text("email").unique().notNull(),
  phone: text("phone").unique(),
  state: text("state"),
  city: text("city"),
  address: text("address"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  shopName: text("shop_name"),
  shopImages: text("images")
    .array()
    .default(sql`ARRAY[]::text[]`),
  average_rating: numeric("average_rating", { precision: 10, scale: 2 })
    .default("0")
    .notNull(),
  rating_count: integer("rating_count").default(0).notNull(),
  totalOrders: integer("total_orders").default(0).notNull(),
  totalRevenue: numeric("total_revenue", { precision: 10, scale: 2 })
    .default("0.00")
    .notNull(),
  pendingOrders: integer("pending_orders").default(0).notNull(),
  acceptedOrders: integer("accepted_orders").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  merchantId: text("merchant_id").references(() => merchants.id, {
    onDelete: "cascade",
  }),
  status: text("status", {
    enum: ["pending", "accepted", "denied", "printing", "completed"],
  })
    .default("pending")
    .notNull(),
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
    .references(() => users.id, { onDelete: "cascade" }),
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
  fileKey: text("file_key").notNull(),
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
    id: text("id").primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("folders_owner_id_idx").on(table.ownerId)],
);

export const signRequestedFiles = pgTable("sign_requested_files", {
  id: serial("id").primaryKey(),
  fileId: text("file_id")
    .notNull()
    .references(() => files.id, { onDelete: "cascade" }),
  requestId: integer("request_id")
    .notNull()
    .references(() => signRequests.id, { onDelete: "cascade" }),
});

export const signatureStatus = pgTable("signature_status", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id")
    .notNull()
    .references(() => signRequests.id, { onDelete: "cascade" }),
  signId: text("sign_id"),
  email: text("email"),
  signatureKey: text("signature_key"),
  status: text("status").default("pending").notNull(),
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

export const services = pgTable("services", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const merchant_services = pgTable("merchant_services", {
  id: text("id").primaryKey(),
  merchantId: text("merchant_id")
    .notNull()
    .references(() => merchants.id, { onDelete: "cascade" }),
  serviceId: text("service_id")
    .notNull()
    .references(() => services.id, { onDelete: "cascade" }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const attributes = pgTable("attributes", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
});

export const attribute_values = pgTable("attribute_values", {
  id: text("id").primaryKey(),
  attributeId: text("attribute_id")
    .notNull()
    .references(() => attributes.id, { onDelete: "cascade" }),
  value: text("value").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pricing_rules = pgTable("pricing_rules", {
  id: text("id").primaryKey(),
  merchantServiceId: text("merchant_service_id")
    .notNull()
    .references(() => merchant_services.id, { onDelete: "cascade" }),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  attributes: jsonb("attributes").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// New blogs table
export const blogs = pgTable("blogs", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  img: text("img").notNull(),
  description: text("description").notNull(),
  content: jsonb("content").notNull(), // Store content as JSONB for the array of {title, bulletpoint}
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// RELATIONS
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

export const merchantsRelations = relations(merchants, ({ many }) => ({
  orders: many(orders),
  reviews: many(reviews),
  merchantServices: many(merchant_services),
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
  }),
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

export const servicesRelations = relations(services, ({ many }) => ({
  merchantServices: many(merchant_services),
}));

export const merchantServicesRelations = relations(
  merchant_services,
  ({ one, many }) => ({
    merchant: one(merchants, {
      fields: [merchant_services.merchantId],
      references: [merchants.id],
    }),
    service: one(services, {
      fields: [merchant_services.serviceId],
      references: [services.id],
    }),
    pricingRules: many(pricing_rules),
  }),
);

export const attributesRelations = relations(attributes, ({ many }) => ({
  attributeValues: many(attribute_values),
}));

export const attributeValuesRelations = relations(
  attribute_values,
  ({ one }) => ({
    attribute: one(attributes, {
      fields: [attribute_values.attributeId],
      references: [attributes.id],
    }),
  }),
);

export const pricingRulesRelations = relations(pricing_rules, ({ one }) => ({
  merchantService: one(merchant_services, {
    fields: [pricing_rules.merchantServiceId],
    references: [merchant_services.id],
  }),
}));