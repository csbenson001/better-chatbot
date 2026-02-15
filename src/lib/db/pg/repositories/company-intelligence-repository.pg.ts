import type { CompanyIntelligenceRepository } from "app-types/company-intelligence";
import { pgDb as db } from "../db.pg";
import {
  CompanyProfileSchema,
  ProductSchema,
  ValueChainSchema,
  SalesMethodologySchema,
} from "../schema.pg";
import { eq, and, desc, ilike } from "drizzle-orm";
import { or } from "drizzle-orm";

export const pgCompanyIntelligenceRepository: CompanyIntelligenceRepository = {
  // ─── Company Profiles ──────────────────────────────────────────────────────

  async insertCompanyProfile(profile) {
    const [result] = await db
      .insert(CompanyProfileSchema)
      .values({
        ...profile,
        annualRevenue:
          profile.annualRevenue != null ? String(profile.annualRevenue) : null,
      })
      .returning();
    return {
      ...result,
      annualRevenue:
        result.annualRevenue != null ? Number(result.annualRevenue) : null,
    } as any;
  },

  async selectCompanyProfilesByTenantId(tenantId, options = {}) {
    const conditions = [eq(CompanyProfileSchema.tenantId, tenantId)];

    if (options.isClientCompany != null) {
      conditions.push(
        eq(CompanyProfileSchema.isClientCompany, options.isClientCompany),
      );
    }
    if (options.industry) {
      conditions.push(eq(CompanyProfileSchema.industry, options.industry));
    }

    const results = await db
      .select()
      .from(CompanyProfileSchema)
      .where(and(...conditions))
      .orderBy(desc(CompanyProfileSchema.createdAt))
      .limit(options.limit ?? 50)
      .offset(options.offset ?? 0);

    return results.map((r) => ({
      ...r,
      annualRevenue: r.annualRevenue != null ? Number(r.annualRevenue) : null,
    })) as any[];
  },

  async selectCompanyProfileById(id, tenantId) {
    const [result] = await db
      .select()
      .from(CompanyProfileSchema)
      .where(
        and(
          eq(CompanyProfileSchema.id, id),
          eq(CompanyProfileSchema.tenantId, tenantId),
        ),
      );
    if (!result) return null;
    return {
      ...result,
      annualRevenue:
        result.annualRevenue != null ? Number(result.annualRevenue) : null,
    } as any;
  },

  async updateCompanyProfile(id, tenantId, data) {
    const setData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date(),
    };
    if (data.annualRevenue != null) {
      setData.annualRevenue = String(data.annualRevenue);
    }

    const [result] = await db
      .update(CompanyProfileSchema)
      .set(setData)
      .where(
        and(
          eq(CompanyProfileSchema.id, id),
          eq(CompanyProfileSchema.tenantId, tenantId),
        ),
      )
      .returning();
    return {
      ...result,
      annualRevenue:
        result.annualRevenue != null ? Number(result.annualRevenue) : null,
    } as any;
  },

  async deleteCompanyProfile(id, tenantId) {
    await db
      .delete(CompanyProfileSchema)
      .where(
        and(
          eq(CompanyProfileSchema.id, id),
          eq(CompanyProfileSchema.tenantId, tenantId),
        ),
      );
  },

  async searchCompanyProfiles(tenantId, query) {
    const pattern = `%${query}%`;
    const results = await db
      .select()
      .from(CompanyProfileSchema)
      .where(
        and(
          eq(CompanyProfileSchema.tenantId, tenantId),
          or(
            ilike(CompanyProfileSchema.name, pattern),
            ilike(CompanyProfileSchema.description, pattern),
          ),
        ),
      )
      .orderBy(desc(CompanyProfileSchema.createdAt))
      .limit(50);

    return results.map((r) => ({
      ...r,
      annualRevenue: r.annualRevenue != null ? Number(r.annualRevenue) : null,
    })) as any[];
  },

  // ─── Products ──────────────────────────────────────────────────────────────

  async insertProduct(product) {
    const [result] = await db.insert(ProductSchema).values(product).returning();
    return result as any;
  },

  async selectProductsByCompanyId(companyId, tenantId) {
    const results = await db
      .select()
      .from(ProductSchema)
      .where(
        and(
          eq(ProductSchema.companyId, companyId),
          eq(ProductSchema.tenantId, tenantId),
        ),
      )
      .orderBy(ProductSchema.name);
    return results as any[];
  },

  async selectProductById(id, tenantId) {
    const [result] = await db
      .select()
      .from(ProductSchema)
      .where(
        and(eq(ProductSchema.id, id), eq(ProductSchema.tenantId, tenantId)),
      );
    return (result as any) ?? null;
  },

  async updateProduct(id, tenantId, data) {
    const [result] = await db
      .update(ProductSchema)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(eq(ProductSchema.id, id), eq(ProductSchema.tenantId, tenantId)),
      )
      .returning();
    return result as any;
  },

  async deleteProduct(id, tenantId) {
    await db
      .delete(ProductSchema)
      .where(
        and(eq(ProductSchema.id, id), eq(ProductSchema.tenantId, tenantId)),
      );
  },

  // ─── Value Chain ───────────────────────────────────────────────────────────

  async insertValueChain(entry) {
    const [result] = await db
      .insert(ValueChainSchema)
      .values(entry)
      .returning();
    return result as any;
  },

  async selectValueChainByCompanyId(companyId, tenantId) {
    const results = await db
      .select()
      .from(ValueChainSchema)
      .where(
        and(
          eq(ValueChainSchema.companyId, companyId),
          eq(ValueChainSchema.tenantId, tenantId),
        ),
      )
      .orderBy(ValueChainSchema.stage);
    return results as any[];
  },

  async deleteValueChain(id, tenantId) {
    await db
      .delete(ValueChainSchema)
      .where(
        and(
          eq(ValueChainSchema.id, id),
          eq(ValueChainSchema.tenantId, tenantId),
        ),
      );
  },

  // ─── Sales Methodology ────────────────────────────────────────────────────

  async insertSalesMethodology(methodology) {
    const [result] = await db
      .insert(SalesMethodologySchema)
      .values(methodology)
      .returning();
    return result as any;
  },

  async selectSalesMethodologyByCompanyId(companyId, tenantId) {
    const results = await db
      .select()
      .from(SalesMethodologySchema)
      .where(
        and(
          eq(SalesMethodologySchema.companyId, companyId),
          eq(SalesMethodologySchema.tenantId, tenantId),
        ),
      )
      .orderBy(SalesMethodologySchema.name);
    return results as any[];
  },

  async updateSalesMethodology(id, tenantId, data) {
    const [result] = await db
      .update(SalesMethodologySchema)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          eq(SalesMethodologySchema.id, id),
          eq(SalesMethodologySchema.tenantId, tenantId),
        ),
      )
      .returning();
    return result as any;
  },

  async deleteSalesMethodology(id, tenantId) {
    await db
      .delete(SalesMethodologySchema)
      .where(
        and(
          eq(SalesMethodologySchema.id, id),
          eq(SalesMethodologySchema.tenantId, tenantId),
        ),
      );
  },
};
