/**
 * farm lifecycles
 */

export default {
  async beforeCreate(event: { params: { data: Record<string, unknown> } }) {
    const { data } = event.params;

    // Validate farmer IDs exist
    if (data.farmers) {
      const farmerIds = Array.isArray(data.farmers)
        ? data.farmers.map((f: unknown) => (typeof f === 'object' && f !== null ? (f as Record<string, unknown>).documentId || (f as Record<string, unknown>).id : f))
        : [typeof data.farmers === 'object' && data.farmers !== null ? (data.farmers as Record<string, unknown>).documentId || (data.farmers as Record<string, unknown>).id : data.farmers];

      const validFarmerIds = farmerIds.filter((id): id is string => typeof id === 'string' && id !== '');

      if (validFarmerIds.length > 0) {
        const existingFarmers = await strapi.documents('api::farmer.farmer').findMany({
          filters: {
            documentId: { $in: validFarmerIds },
          },
          fields: ['documentId'],
        });

        if (existingFarmers.length !== validFarmerIds.length) {
          const foundIds = existingFarmers.map((f: Record<string, unknown>) => f.documentId);
          const missingIds = validFarmerIds.filter((id) => !foundIds.includes(id));
          throw new Error(`Invalid farmer ID(s): ${missingIds.join(', ')}`);
        }
      }
    }

    // Validate barangay exists
    if (data.barangay) {
      const barangayId = typeof data.barangay === 'object' && data.barangay !== null
        ? (data.barangay as Record<string, unknown>).documentId || (data.barangay as Record<string, unknown>).id
        : data.barangay;

      if (barangayId) {
        const barangay = await strapi.documents('api::barangay.barangay').findOne({
          documentId: barangayId as string,
          fields: ['documentId', 'code'],
        });

        if (!barangay) {
          throw new Error(`Invalid barangay ID: ${barangayId}`);
        }

        // Store barangay code for farm_code generation
        data._barangayCode = (barangay as Record<string, unknown>).code as string;
      }
    }

    // Generate farm_code using barangay code
    if (data._barangayCode) {
      const barangayCode = data._barangayCode;

      // Count existing farms for this barangay
      const count = await strapi.db.query('api::farm.farm').count({
        where: {
          farm_code: {
            $startsWith: `FRM-${barangayCode}-`,
          },
        },
      });

      // Generate sequential number (3 digits, zero-padded)
      const sequence = (count + 1).toString().padStart(3, '0');

      // Set farm_code
      data.farm_code = `FRM-${barangayCode}-${sequence}`;
    }

    // Clean up temp field
    delete data._barangayCode;
  },
};