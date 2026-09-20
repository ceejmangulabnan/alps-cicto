/**
 * custom farmer controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::farmer.farmer', ({ strapi }) => ({
  /**
   * GET /farmers/deep
   * Find farmers with deep population of nested relations
   */
  async findDeep(ctx) {
    try {
      const { query } = ctx;

      const queryParams = {
        ...query,
        populate: {
          farms: {
            populate: {
              farm_parcels: {
                populate: ['planting_cycle', 'inspections'],
              },
              barangay: true,
            },
          },
          barangays: true,
        },
      } as Record<string, unknown>;

      const results = await strapi.documents('api::farmer.farmer').findMany(queryParams);

      ctx.body = { data: results };
    } catch (err) {
      ctx.throw(500, err instanceof Error ? err.message : 'An error occurred');
    }
  },

  /**
   * GET /farmers/:id/deep
   * Find one farmer with deep population of nested relations
   */
  async findOneDeep(ctx) {
    try {
      const { id } = ctx.params;
      const { query } = ctx;

      const queryParams = {
        ...query,
        populate: {
          farms: {
            populate: {
              farm_parcels: {
                populate: ['planting_cycle', 'inspections'],
              },
              barangay: true,
            },
          },
          barangays: true,
        },
      } as Record<string, unknown>;

      const result = await strapi.documents('api::farmer.farmer').findOne({ documentId: id, ...queryParams });

      if (!result) {
        return ctx.notFound('Farmer not found');
      }

      ctx.body = { data: result };
    } catch (err) {
      ctx.throw(500, err instanceof Error ? err.message : 'An error occurred');
    }
  },

  /**
   * GET /farmers/search
   * Search farmers with filters: name, farmer_code, barangay
   */
  async search(ctx) {
    try {
      const { query } = ctx;
      const filters = (query.filters || {}) as Record<string, unknown>;

      const searchFilters: Record<string, unknown> = {};

      if (filters.name) {
        searchFilters.name = { $containsi: filters.name };
      }

      if (filters.farmer_code) {
        searchFilters.farmer_code = { $eq: filters.farmer_code };
      }

      if (filters.barangay) {
        searchFilters.farms = {
          barangay: {
            $or: [
              { name: { $eq: filters.barangay } },
              { code: { $eq: filters.barangay } },
            ],
          },
        };
      }

      const mergedFilters = {
        ...searchFilters,
        ...filters,
      };

      const queryParams = {
        ...query,
        filters: mergedFilters,
        populate: {
          farms: {
            populate: {
              barangay: true,
              farm_parcels: true,
            },
          },
          barangays: true,
        },
      } as Record<string, unknown>;

      const results = await strapi.documents('api::farmer.farmer').findMany(queryParams);

      ctx.body = { data: results };
    } catch (err) {
      ctx.throw(500, err instanceof Error ? err.message : 'An error occurred');
    }
  },
}));