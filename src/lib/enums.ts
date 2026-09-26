// Maps between the form labels shown to clients and the database enum values.
import type { Database } from "@/integrations/supabase/types";

type E = Database["public"]["Enums"];

export const PLATFORM_TO_DB: Record<string, E["platform_type"]> = {
  AWS: "aws", Azure: "azure", "Microsoft Fabric": "fabric", Databricks: "databricks",
  Snowflake: "snowflake", "Not decided": "not_decided", Other: "other",
};
export const NEED_TO_DB: Record<string, E["need_type"]> = {
  "Data platform or lakehouse": "data_platform", "ETL/pipelines": "pipelines", Migration: "migration",
  "Cost optimization": "cost", "Governance & security": "governance",
  "RAG / chatbot on our data": "rag_chatbot", "Vector search": "vector_search",
  "LLM data preparation": "llm_data_prep", "AI-readiness review": "ai_readiness",
  "New web application": "web_app", "AI-enabled API or integration": "ai_api",
  "Modernize existing app": "app_modernization", Microservices: "microservices",
};
export const BUDGET_TO_DB: Record<string, E["budget_range"]> = {
  "Under $5k": "under_5k", "$5k–20k": "5k_20k", "$20k–50k": "20k_50k", "Over $50k": "over_50k", "Not sure": "not_sure",
};

const invert = <T extends string>(m: Record<string, T>) =>
  Object.fromEntries(Object.entries(m).map(([k, v]) => [v, k])) as Record<T, string>;

export const PLATFORM_LABEL = invert(PLATFORM_TO_DB);
export const NEED_LABEL: Record<string, string> = { ...invert(NEED_TO_DB), other: "Other" };
export const BUDGET_LABEL = invert(BUDGET_TO_DB);
export const AREA_LABEL: Record<string, string> = { data: "Data", ai: "AI", web: "Web" };
