import { pgTable, integer, varchar, boolean, real, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  password_hash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("humanity"),
  display_name: varchar("display_name", { length: 255 }).notNull(),
});

export type User = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;

export const batchesTable = pgTable("batches", {
  batch_id: integer("batch_id").primaryKey().generatedAlwaysAsIdentity(),
  batch_name: varchar("batch_name").notNull(),
  is_complete: boolean("is_complete").notNull().default(false),
});

export type Batch = typeof batchesTable.$inferSelect;
export type InsertBatch = typeof batchesTable.$inferInsert;

export const drugsTable = pgTable("drugs", {
  drug_id: integer("drug_id").primaryKey().generatedAlwaysAsIdentity(),
  ar_name: varchar("ar_name").notNull(),
  en_name: varchar("en_name").notNull(),
  price: real("price").notNull(),
  local_or_not: boolean("local_or_not").notNull().default(true),
});

export type Drug = typeof drugsTable.$inferSelect;
export type InsertDrug = typeof drugsTable.$inferInsert;

export const personsTable = pgTable("persons", {
  person_id: integer("person_id").primaryKey().generatedAlwaysAsIdentity(),
  full_name: varchar("full_name").notNull(),
  ph_number: varchar("ph_number").notNull(),
  location: varchar("location").notNull(),
  batch_id: integer("batch_id").references(() => batchesTable.batch_id),
  is_complete: boolean("is_complete").notNull().default(false),
  total_cost: real("total_cost").notNull().default(0),
  inv_number: varchar("inv_number").notNull(),
});

export type Person = typeof personsTable.$inferSelect;
export type InsertPerson = typeof personsTable.$inferInsert;

export const recordsTable = pgTable("records", {
  record_id: integer("record_id").primaryKey().generatedAlwaysAsIdentity(),
  drug_id: integer("drug_id").references(() => drugsTable.drug_id),
  person_id: integer("person_id").references(() => personsTable.person_id),
  batch_id: integer("batch_id").references(() => batchesTable.batch_id),
  final_price: real("final_price").notNull(),
  ordered: boolean("ordered").notNull().default(false),
  prepared: boolean("prepared").notNull().default(false),
  ready: boolean("ready").notNull().default(false),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export type Record = typeof recordsTable.$inferSelect;
export type InsertRecord = typeof recordsTable.$inferInsert;

export const insertUserSchema = z.object({
  username: z.string(),
  password_hash: z.string(),
  role: z.string().optional(),
  display_name: z.string(),
});

export const insertBatchSchema = z.object({
  batch_name: z.string(),
  is_complete: z.boolean().optional(),
});

export const insertDrugSchema = z.object({
  ar_name: z.string(),
  en_name: z.string(),
  price: z.number(),
  local_or_not: z.boolean(),
});

export const insertPersonSchema = z.object({
  full_name: z.string(),
  ph_number: z.string(),
  location: z.string(),
  batch_id: z.number().optional().nullable(),
  is_complete: z.boolean().optional(),
  total_cost: z.number().optional(),
  inv_number: z.string(),
});

export const insertRecordSchema = z.object({
  drug_id: z.number().optional().nullable(),
  person_id: z.number().optional().nullable(),
  batch_id: z.number().optional().nullable(),
  final_price: z.number(),
  ordered: z.boolean().optional(),
  prepared: z.boolean().optional(),
  ready: z.boolean().optional(),
});
