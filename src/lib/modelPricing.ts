import { db, memoryDb } from "../db";
import { aiModelPricingMetadataTable, AiModelPricingMetadataRow } from "../db/schema";
import { eq } from "drizzle-orm";

export async function getModelPricingMetadata(modelId: string): Promise<AiModelPricingMetadataRow> {
  if (db) {
    try {
      const rows = await db.select().from(aiModelPricingMetadataTable).where(eq(aiModelPricingMetadataTable.modelId, modelId)).limit(1);
      if (rows.length > 0) return rows[0];
    } catch {
      // Fallback
    }
  }

  const mem = memoryDb.aiModelPricingMetadata.get(modelId);
  if (mem) return mem;

  // Default fallback for unlisted models
  return {
    modelId,
    provider: modelId.includes("gemini") ? "gemini" : modelId.includes("gpt") ? "openai" : "anthropic",
    promptTokensMicrosPer1k: 200,
    completionTokensMicrosPer1k: 800,
    customerMarkupMultiplier: "1.50",
    updatedAt: new Date(),
  };
}

export async function getAllModelPricingMetadata(): Promise<AiModelPricingMetadataRow[]> {
  if (db) {
    try {
      return await db.select().from(aiModelPricingMetadataTable);
    } catch {
      // Fallback
    }
  }
  return Array.from(memoryDb.aiModelPricingMetadata.values());
}

export async function updateModelPricingMetadata(
  modelId: string,
  updates: Partial<AiModelPricingMetadataRow>
): Promise<AiModelPricingMetadataRow> {
  const existing = await getModelPricingMetadata(modelId);
  const now = new Date();

  const record: AiModelPricingMetadataRow = {
    modelId,
    provider: updates.provider || existing.provider,
    promptTokensMicrosPer1k: updates.promptTokensMicrosPer1k ?? existing.promptTokensMicrosPer1k,
    completionTokensMicrosPer1k: updates.completionTokensMicrosPer1k ?? existing.completionTokensMicrosPer1k,
    customerMarkupMultiplier: updates.customerMarkupMultiplier || existing.customerMarkupMultiplier,
    updatedAt: now,
  };

  if (db) {
    try {
      await db.insert(aiModelPricingMetadataTable).values(record).onConflictDoUpdate({
        target: aiModelPricingMetadataTable.modelId,
        set: record,
      });
    } catch {
      // Fallback
    }
  }

  memoryDb.aiModelPricingMetadata.set(modelId, record);
  return record;
}

export interface AiUsageCostCalculation {
  modelId: string;
  provider: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  providerCostMicros: number;
  customerCreditMicros: number;
  platformMarginMicros: number;
  customerMarkupMultiplier: number;
}

export async function calculateAiUsageCost(
  modelId: string,
  promptTokens: number,
  completionTokens: number
): Promise<AiUsageCostCalculation> {
  const metadata = await getModelPricingMetadata(modelId);
  const promptTokensSafe = Math.max(0, promptTokens);
  const completionTokensSafe = Math.max(0, completionTokens);
  const totalTokens = promptTokensSafe + completionTokensSafe;

  const promptCostMicros = (promptTokensSafe * metadata.promptTokensMicrosPer1k) / 1000;
  const completionCostMicros = (completionTokensSafe * metadata.completionTokensMicrosPer1k) / 1000;
  
  // Exact provider cost in integer micros
  const providerCostMicros = Math.max(1, Math.round(promptCostMicros + completionCostMicros));

  const multiplier = parseFloat(metadata.customerMarkupMultiplier || "1.50");
  
  // Customer credit consumption in integer micros (at least equal to provider cost or minimum 500 micros = $0.0005)
  const customerCreditMicros = Math.max(providerCostMicros, Math.round(providerCostMicros * multiplier));

  const platformMarginMicros = customerCreditMicros - providerCostMicros;

  return {
    modelId,
    provider: metadata.provider,
    promptTokens: promptTokensSafe,
    completionTokens: completionTokensSafe,
    totalTokens,
    providerCostMicros,
    customerCreditMicros,
    platformMarginMicros,
    customerMarkupMultiplier: multiplier,
  };
}
