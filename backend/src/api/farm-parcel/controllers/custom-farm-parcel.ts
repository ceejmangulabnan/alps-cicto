/**
 * custom farm-parcel controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::farm-parcel.farm-parcel', ({ strapi }) => ({
  /**
   * GET /farm-parcels/idle-at-risk
   * Filter idle/at-risk parcels where area_hectares > 0.50 for high-value crop reactivation
   */
  async idleAtRisk(ctx) {
    try {
      const { query } = ctx;

      const filters: Record<string, unknown> = {
        $or: [
          { land_status: { $eq: 'Idle' } },
          { land_status: { $eq: 'At Risk' } },
        ],
        area_hectares: { $gt: 0.5 },
      };

      if (query.filters) {
        Object.assign(filters, query.filters);
      }

      const queryParams = {
        ...query,
        filters,
        populate: query.populate || ['farm', 'planting_cycle', 'inspections'],
      };

      const results = await strapi.documents('api::farm-parcel.farm-parcel').findMany(queryParams);

      ctx.body = { data: results };
    } catch (err) {
      ctx.throw(500, err instanceof Error ? err.message : 'An error occurred');
    }
  },

  /**
   * GET /farm-parcels/recommendations
   * Rule engine endpoint for decision-support suggestions for underutilized land
   */
  async recommendations(ctx) {
    try {
      const { query } = ctx;

      const baseFilters: Record<string, unknown> = {
        $or: [
          { land_status: { $eq: 'Idle' } },
          { land_status: { $eq: 'Fallow' } },
          { land_status: { $eq: 'At Risk' } },
        ],
        area_hectares: { $gt: 0.5 },
        planting_cycle: { $null: true },
      };

      const filters = {
        ...baseFilters,
        ...(query.filters || {}),
      };

      const queryParams = {
        ...query,
        filters,
        populate: query.populate || ['farm', 'farm.barangay', 'farm.farmers'],
      };

      const parcels = await strapi.documents('api::farm-parcel.farm-parcel').findMany(queryParams);

      const recommendations = parcels.map((parcel: Record<string, unknown>) => {
        const parcelData = parcel as Record<string, unknown>;
        const farm = parcelData.farm as Record<string, unknown> | null;
        const barangay = farm?.barangay as Record<string, unknown> | null;

        let priority: 'High' | 'Medium' | 'Low' = 'Medium';
        const suggestions: string[] = [];

        if (parcelData.land_status === 'At Risk') {
          priority = 'High';
          suggestions.push('Immediate intervention required - land degradation risk');
          suggestions.push('Consider soil conservation measures (contour farming, cover crops)');
        } else if (parcelData.land_status === 'Idle' && Number(parcelData.area_hectares) > 2) {
          priority = 'High';
          suggestions.push('High-value crop reactivation candidate (e.g., cacao, coffee, high-value vegetables)');
          suggestions.push('Conduct soil fertility analysis before replanting');
        } else if (parcelData.land_status === 'Fallow') {
          priority = 'Medium';
          suggestions.push('Crop rotation opportunity - consider legumes for nitrogen fixation');
          suggestions.push('Green manure cover crop recommended');
        } else if (parcelData.land_status === 'Idle') {
          priority = 'Medium';
          suggestions.push('Suitable for diversified smallholder crops (vegetables, fruit trees)');
          suggestions.push('Consider intercropping systems for risk diversification');
        }

        const area = Number(parcelData.area_hectares);
        if (area > 5) {
          suggestions.push('Large parcel - consider mechanization or contract farming arrangements');
        } else if (area < 1) {
          suggestions.push('Small parcel - intensive cultivation methods recommended (raised beds, container gardening)');
        }

        if (barangay) {
          suggestions.push(`Located in ${barangay.name} - check local agricultural extension services for support`);
        }

        return {
          parcel_id: parcelData.documentId || parcelData.id,
          parcel_code: parcelData.parcel_code,
          area_hectares: parcelData.area_hectares,
          land_status: parcelData.land_status,
          current_use: parcelData.current_use || 'Not specified',
          farm: farm ? {
            farm_id: farm.documentId || farm.id,
            farm_code: farm.farm_code,
            barangay: barangay ? {
              name: barangay.name,
              code: barangay.code,
            } : null,
          } : null,
          priority,
          suggestions: [...new Set(suggestions)],
          recommended_actions: generateRecommendedActions(parcelData, priority),
        };
      });

      const priorityOrder = { High: 0, Medium: 1, Low: 2 };
      recommendations.sort((a, b) => {
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return Number(b.area_hectares) - Number(a.area_hectares);
      });

      ctx.body = { data: recommendations };
    } catch (err) {
      ctx.throw(500, err instanceof Error ? err.message : 'An error occurred');
    }
  },
}));

function generateRecommendedActions(parcel: Record<string, unknown>, priority: 'High' | 'Medium' | 'Low') {
  const actions = [];
  const status = parcel.land_status as string;
  const area = Number(parcel.area_hectares);

  if (priority === 'High') {
    actions.push({
      action: 'Soil Testing',
      timeline: 'Immediate (within 2 weeks)',
      description: 'Comprehensive soil analysis (pH, NPK, organic matter, micronutrients)',
    });
    actions.push({
      action: 'Technical Assessment',
      timeline: 'Within 1 month',
      description: 'On-site evaluation by agricultural technician',
    });
  }

  if (status === 'Idle' || status === 'Fallow') {
    actions.push({
      action: 'Land Preparation',
      timeline: 'Before planting season',
      description: 'Clearing, plowing, harrowing, and leveling as appropriate',
    });
    actions.push({
      action: 'Crop Selection',
      timeline: 'Before planting season',
      description: 'Select crops based on soil test results, market demand, and climate suitability',
    });
  }

  if (status === 'At Risk') {
    actions.push({
      action: 'Erosion Control',
      timeline: 'Immediate',
      description: 'Install contour lines, terraces, or vegetative barriers',
    });
    actions.push({
      action: 'Drainage Improvement',
      timeline: 'Before rainy season',
      description: 'Establish proper drainage to prevent waterlogging',
    });
  }

  if (area > 1) {
    actions.push({
      action: 'Irrigation Assessment',
      timeline: 'Before dry season',
      description: 'Evaluate water source availability and irrigation options',
    });
  }

  actions.push({
    action: 'Monitoring Setup',
    timeline: 'Ongoing',
    description: 'Establish regular monitoring schedule for crop health and soil conditions',
  });

  return actions;
}