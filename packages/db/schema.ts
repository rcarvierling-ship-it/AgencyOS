import { pgTable, text, timestamp, integer, uuid, jsonb } from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const agencySettings = pgTable("agency_settings", {
  id: text("id").primaryKey().default("default"),
  agencyName: text("agency_name").notNull().default("RCV Agency"),
  websiteUrl: text("website_url"),
  timezone: text("timezone").notNull().default("America/New_York"),
  currency: text("currency").notNull().default("USD"),
  defaultPipelineStage: text("default_pipeline_stage").notNull().default("discovered"),
  defaultOpportunityValueCents: integer("default_opportunity_value_cents").notNull().default(250000),
  defaultOpportunityProbability: integer("default_opportunity_probability").notNull().default(50),
  notifications: jsonb("notifications").notNull().default({}),
  ...timestamps,
});

export const businesses = pgTable("businesses", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  legalName: text("legal_name"),
  industry: text("industry"),
  websiteUrl: text("website_url"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  postalCode: text("postal_code"),
  country: text("country").default("US"),
  googlePlaceId: text("google_place_id").unique(),
  status: text("status").notNull().default("discovered"),
  opportunityScore: integer("opportunity_score"),
  notes: text("notes"),
  metadata: jsonb("metadata"),
  ...timestamps,
});

export const businessContacts = pgTable("business_contacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessId: uuid("business_id").notNull().references(() => businesses.id),
  name: text("name").notNull(),
  role: text("role"),
  email: text("email"),
  phone: text("phone"),
  source: text("source"),
  ...timestamps,
});

export const businessResearch = pgTable("business_research", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessId: uuid("business_id").notNull().references(() => businesses.id),
  summary: text("summary"),
  services: jsonb("services"),
  competitors: jsonb("competitors"),
  reviews: jsonb("reviews"),
  brandProfile: jsonb("brand_profile"),
  research: jsonb("research"),
  source: text("source"),
  ...timestamps,
});

export const websiteAudits = pgTable("website_audits", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessId: uuid("business_id").notNull().references(() => businesses.id),
  url: text("url"),
  overallScore: integer("overall_score"),
  designScore: integer("design_score"),
  mobileScore: integer("mobile_score"),
  performanceScore: integer("performance_score"),
  seoScore: integer("seo_score"),
  accessibilityScore: integer("accessibility_score"),
  conversionScore: integer("conversion_score"),
  findings: jsonb("findings"),
  ...timestamps,
});

export const opportunities = pgTable("opportunities", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessId: uuid("business_id").notNull().references(() => businesses.id),
  name: text("name").notNull().default("Website opportunity"),
  stage: text("stage").notNull().default("discovered"),
  valueCents: integer("value_cents"),
  probability: integer("probability"),
  lostReason: text("lost_reason"),
  ...timestamps,
});

export const businessActivities = pgTable("business_activities", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessId: uuid("business_id").notNull().references(() => businesses.id),
  opportunityId: uuid("opportunity_id").references(() => opportunities.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  detail: text("detail"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const demos = pgTable("demos", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessId: uuid("business_id").notNull().references(() => businesses.id),
  opportunityId: uuid("opportunity_id").references(() => opportunities.id),
  slug: text("slug").notNull().unique(),
  status: text("status").notNull().default("generating"),
  previewUrl: text("preview_url"),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  metadata: jsonb("metadata"),
  ...timestamps,
});

export const demoEvents = pgTable("demo_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  demoId: uuid("demo_id").notNull().references(() => demos.id),
  type: text("type").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const clients = pgTable("clients", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessId: uuid("business_id").notNull().unique().references(() => businesses.id),
  status: text("status").notNull().default("onboarding"),
  hostingMode: text("hosting_mode"),
  ...timestamps,
});

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessId: uuid("business_id").notNull().references(() => businesses.id),
  clientId: uuid("client_id").references(() => clients.id),
  name: text("name").notNull(),
  status: text("status").notNull().default("onboarding"),
  ...timestamps,
});

export const productionWebsites = pgTable("production_websites", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessId: uuid("business_id").notNull().references(() => businesses.id),
  projectId: uuid("project_id").references(() => projects.id),
  domain: text("domain"),
  repositoryUrl: text("repository_url"),
  deploymentUrl: text("deployment_url"),
  hostingMode: text("hosting_mode"),
  status: text("status").notNull().default("development"),
  ...timestamps,
});
