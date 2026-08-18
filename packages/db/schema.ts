import { pgEnum, pgTable, text, timestamp, uuid, integer, boolean, jsonb } from "drizzle-orm/pg-core";

export const businessStatus = pgEnum("business_status", ["prospect","qualified","contacted","interested","client","declined","do_not_contact","archived"]);
export const opportunityStage = pgEnum("opportunity_stage", ["discovered","qualified","researching","demo_building","demo_ready","contacted","responded","interested","proposal","won","lost","do_not_contact"]);
export const hostingMode = pgEnum("hosting_mode", ["managed","self_hosted"]);

export const businesses = pgTable("businesses", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  status: businessStatus("status").default("prospect").notNull(),
  industry: text("industry"),
  description: text("description"),
  phone: text("phone"),
  email: text("email"),
  websiteUrl: text("website_url"),
  googlePlaceId: text("google_place_id"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  postalCode: text("postal_code"),
  country: text("country").default("US"),
  opportunityScore: integer("opportunity_score"),
  websiteScore: integer("website_score"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const contacts = pgTable("business_contacts", {
  id: uuid("id").defaultRandom().primaryKey(), businessId: uuid("business_id").notNull().references(() => businesses.id),
  name: text("name").notNull(), role: text("role"), email: text("email"), phone: text("phone"), isPrimary: boolean("is_primary").default(false).notNull(), metadata: jsonb("metadata"), createdAt: timestamp("created_at", {withTimezone:true}).defaultNow().notNull()
});

export const opportunities = pgTable("opportunities", {
  id: uuid("id").defaultRandom().primaryKey(), businessId: uuid("business_id").notNull().references(() => businesses.id),
  name: text("name").notNull(), stage: opportunityStage("stage").default("discovered").notNull(), valueCents: integer("value_cents"), probability: integer("probability"), source: text("source"), createdAt: timestamp("created_at", {withTimezone:true}).defaultNow().notNull(), updatedAt: timestamp("updated_at", {withTimezone:true}).defaultNow().notNull()
});

export const websiteAudits = pgTable("website_audits", { id: uuid("id").defaultRandom().primaryKey(), businessId: uuid("business_id").notNull().references(() => businesses.id), overallScore: integer("overall_score"), designScore: integer("design_score"), mobileScore: integer("mobile_score"), performanceScore: integer("performance_score"), seoScore: integer("seo_score"), conversionScore: integer("conversion_score"), accessibilityScore: integer("accessibility_score"), findings: jsonb("findings"), createdAt: timestamp("created_at", {withTimezone:true}).defaultNow().notNull() });

export const demos = pgTable("demos", { id: uuid("id").defaultRandom().primaryKey(), businessId: uuid("business_id").notNull().references(() => businesses.id), opportunityId: uuid("opportunity_id").references(() => opportunities.id), slug: text("slug").notNull().unique(), status: text("status").default("generating").notNull(), previewUrl: text("preview_url"), version: integer("version").default(1).notNull(), metadata: jsonb("metadata"), createdAt: timestamp("created_at", {withTimezone:true}).defaultNow().notNull(), updatedAt: timestamp("updated_at", {withTimezone:true}).defaultNow().notNull() });

export const outreach = pgTable("outreach", { id: uuid("id").defaultRandom().primaryKey(), businessId: uuid("business_id").notNull().references(() => businesses.id), opportunityId: uuid("opportunity_id").references(() => opportunities.id), channel: text("channel").default("email").notNull(), subject: text("subject"), body: text("body"), status: text("status").default("draft").notNull(), sentAt: timestamp("sent_at", {withTimezone:true}), createdAt: timestamp("created_at", {withTimezone:true}).defaultNow().notNull() });

export const clients = pgTable("clients", { id: uuid("id").defaultRandom().primaryKey(), businessId: uuid("business_id").notNull().unique().references(() => businesses.id), joinedAt: timestamp("joined_at", {withTimezone:true}).defaultNow().notNull(), notes: text("notes") });
export const projects = pgTable("projects", { id: uuid("id").defaultRandom().primaryKey(), businessId: uuid("business_id").notNull().references(() => businesses.id), clientId: uuid("client_id").references(() => clients.id), name: text("name").notNull(), status: text("status").default("onboarding").notNull(), createdAt: timestamp("created_at", {withTimezone:true}).defaultNow().notNull(), updatedAt: timestamp("updated_at", {withTimezone:true}).defaultNow().notNull() });
export const productionWebsites = pgTable("production_websites", { id: uuid("id").defaultRandom().primaryKey(), businessId: uuid("business_id").notNull().references(() => businesses.id), projectId: uuid("project_id").references(() => projects.id), domain: text("domain"), deploymentUrl: text("deployment_url"), hosting: hostingMode("hosting").default("managed").notNull(), status: text("status").default("draft").notNull(), createdAt: timestamp("created_at", {withTimezone:true}).defaultNow().notNull(), updatedAt: timestamp("updated_at", {withTimezone:true}).defaultNow().notNull() });

export const activityLog = pgTable("activity_log", { id: uuid("id").defaultRandom().primaryKey(), businessId: uuid("business_id").references(() => businesses.id), type: text("type").notNull(), title: text("title").notNull(), description: text("description"), metadata: jsonb("metadata"), createdAt: timestamp("created_at", {withTimezone:true}).defaultNow().notNull() });
