import type { Core } from '@strapi/strapi'

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    const ROLES = [
      {
        name: 'Administrator',
        type: 'administrator',
        legacyNames: ['Admin', 'Administrator'],
        legacyTypes: ['admin', 'administrator'],
        permissions: [
          'plugin::users-permissions.user.find',
          'plugin::users-permissions.user.findOne',
          'plugin::users-permissions.user.create',
          'plugin::users-permissions.user.update',
          'plugin::users-permissions.user.destroy',
          'plugin::users-permissions.user.count',
          'plugin::users-permissions.user.me',
          'plugin::users-permissions.role.find',
          'plugin::users-permissions.role.findOne',
          // Farm Parcel permissions (full CRUD + custom)
          'api::farm-parcel.farm-parcel.find',
          'api::farm-parcel.farm-parcel.findOne',
          'api::farm-parcel.farm-parcel.create',
          'api::farm-parcel.farm-parcel.update',
          'api::farm-parcel.farm-parcel.destroy',
          'api::farm-parcel.farm-parcel.count',
          'api::farm-parcel.custom-farm-parcel.idleAtRisk',
          'api::farm-parcel.custom-farm-parcel.recommendations',
          // Farmer permissions (full CRUD + custom)
          'api::farmer.farmer.find',
          'api::farmer.farmer.findOne',
          'api::farmer.farmer.create',
          'api::farmer.farmer.update',
          'api::farmer.farmer.destroy',
          'api::farmer.farmer.count',
          'api::farmer.custom-farmer.findDeep',
          'api::farmer.custom-farmer.findOneDeep',
          'api::farmer.custom-farmer.search',
          // Farm permissions (full CRUD + custom)
          'api::farm.farm.find',
          'api::farm.farm.findOne',
          'api::farm.farm.create',
          'api::farm.farm.update',
          'api::farm.farm.destroy',
          'api::farm.farm.count',
          'api::farm.custom-farm.findWithSummary',
          'api::farm.custom-farm.findOneWithSummary',
          // Barangay permissions
          'api::barangay.barangay.find',
          'api::barangay.barangay.findOne',
          'api::barangay.barangay.create',
          'api::barangay.barangay.update',
          'api::barangay.barangay.destroy',
          'api::barangay.barangay.count',
          // Crop permissions
          'api::crop.crop.find',
          'api::crop.crop.findOne',
          'api::crop.crop.create',
          'api::crop.crop.update',
          'api::crop.crop.destroy',
          'api::crop.crop.count',
          // Planting Cycle permissions
          'api::planting-cycle.planting-cycle.find',
          'api::planting-cycle.planting-cycle.findOne',
          'api::planting-cycle.planting-cycle.create',
          'api::planting-cycle.planting-cycle.update',
          'api::planting-cycle.planting-cycle.destroy',
          'api::planting-cycle.planting-cycle.count',
          // Inspection permissions
          'api::inspection.inspection.find',
          'api::inspection.inspection.findOne',
          'api::inspection.inspection.create',
          'api::inspection.inspection.update',
          'api::inspection.inspection.destroy',
          'api::inspection.inspection.count',
          // Harvest permissions
          'api::harvest.harvest.find',
          'api::harvest.harvest.findOne',
          'api::harvest.harvest.create',
          'api::harvest.harvest.update',
          'api::harvest.harvest.destroy',
          'api::harvest.harvest.count',
          // Risk Report permissions
          'api::risk-report.risk-report.find',
          'api::risk-report.risk-report.findOne',
          'api::risk-report.risk-report.create',
          'api::risk-report.risk-report.update',
          'api::risk-report.risk-report.destroy',
          'api::risk-report.risk-report.count',
        ],
      },
      {
        name: 'Authenticated',
        type: 'authenticated',
        legacyNames: ['Authenticated'],
        legacyTypes: ['authenticated'],
        permissions: [
          // Core user permissions (read-only)
          'plugin::users-permissions.role.find',
          'plugin::users-permissions.role.findOne',
          'plugin::users-permissions.user.me',
          'plugin::users-permissions.user.find',
          'plugin::users-permissions.user.findOne',
          'plugin::users-permissions.user.count',
          // Farm Parcel permissions (full CRUD + custom)
          'api::farm-parcel.farm-parcel.find',
          'api::farm-parcel.farm-parcel.findOne',
          'api::farm-parcel.farm-parcel.create',
          'api::farm-parcel.farm-parcel.update',
          'api::farm-parcel.farm-parcel.destroy',
          'api::farm-parcel.farm-parcel.count',
          'api::farm-parcel.custom-farm-parcel.idleAtRisk',
          'api::farm-parcel.custom-farm-parcel.recommendations',
          // Farmer permissions (full CRUD + custom)
          'api::farmer.farmer.find',
          'api::farmer.farmer.findOne',
          'api::farmer.farmer.create',
          'api::farmer.farmer.update',
          'api::farmer.farmer.destroy',
          'api::farmer.farmer.count',
          'api::farmer.custom-farmer.findDeep',
          'api::farmer.custom-farmer.findOneDeep',
          'api::farmer.custom-farmer.search',
          // Farm permissions (full CRUD + custom)
          'api::farm.farm.find',
          'api::farm.farm.findOne',
          'api::farm.farm.create',
          'api::farm.farm.update',
          'api::farm.farm.destroy',
          'api::farm.farm.count',
          'api::farm.custom-farm.findWithSummary',
          'api::farm.custom-farm.findOneWithSummary',
          // Barangay permissions
          'api::barangay.barangay.find',
          'api::barangay.barangay.findOne',
          'api::barangay.barangay.create',
          'api::barangay.barangay.update',
          'api::barangay.barangay.destroy',
          'api::barangay.barangay.count',
          // Crop permissions
          'api::crop.crop.find',
          'api::crop.crop.findOne',
          'api::crop.crop.create',
          'api::crop.crop.update',
          'api::crop.crop.destroy',
          'api::crop.crop.count',
          // Planting Cycle permissions
          'api::planting-cycle.planting-cycle.find',
          'api::planting-cycle.planting-cycle.findOne',
          'api::planting-cycle.planting-cycle.create',
          'api::planting-cycle.planting-cycle.update',
          'api::planting-cycle.planting-cycle.destroy',
          'api::planting-cycle.planting-cycle.count',
          // Inspection permissions
          'api::inspection.inspection.find',
          'api::inspection.inspection.findOne',
          'api::inspection.inspection.create',
          'api::inspection.inspection.update',
          'api::inspection.inspection.destroy',
          'api::inspection.inspection.count',
          // Harvest permissions
          'api::harvest.harvest.find',
          'api::harvest.harvest.findOne',
          'api::harvest.harvest.create',
          'api::harvest.harvest.update',
          'api::harvest.harvest.destroy',
          'api::harvest.harvest.count',
          // Risk Report permissions
          'api::risk-report.risk-report.find',
          'api::risk-report.risk-report.findOne',
          'api::risk-report.risk-report.create',
          'api::risk-report.risk-report.update',
          'api::risk-report.risk-report.destroy',
          'api::risk-report.risk-report.count',
        ],
      },
    ]

    const findRole = (where: object) =>
      strapi.db.query('plugin::users-permissions.role').findOne({ where })

    const ensureRole = async ({
      name,
      type,
      legacyNames,
      legacyTypes,
    }: (typeof ROLES)[number]) => {
      const roleService = strapi.plugin('users-permissions').service('role')

      let role =
        (await findRole({ name: { $in: legacyNames } })) ??
        (await findRole({ type: { $in: legacyTypes } }))

      if (!role) {
        await roleService.createRole({ name, type })
        role = await findRole({ type })
      } else if (role.name !== name || role.type !== type) {
        role = await strapi.db.query('plugin::users-permissions.role').update({
          where: { id: role.id },
          data: { name, type },
        })
      }

      return role.id
    }

    const ensurePermissions = async (roleId: number, actions: string[]) => {
      const existing = await strapi.db
        .query('plugin::users-permissions.permission')
        .findMany({ where: { role: { id: roleId } } })

      const existingActions = new Set(existing.map((p) => p.action))
      const missing = actions.filter((action) => !existingActions.has(action))

      if (missing.length > 0) {
        await Promise.all(
          missing.map((action) =>
            strapi.db.query('plugin::users-permissions.permission').create({
              data: { action, role: roleId },
            }),
          ),
        )
      }

      const stale = existing.filter(
        (permission) => !actions.includes(permission.action),
      )

      if (stale.length > 0) {
        await Promise.all(
          stale.map((permission) =>
            strapi.db
              .query('plugin::users-permissions.permission')
              .delete({ where: { id: permission.id } }),
          ),
        )
      }
    }

    const ensureAdvancedSettings = async () => {
      const pluginStore = strapi.store({
        type: 'plugin',
        name: 'users-permissions',
      })
      const advanced = (await pluginStore.get({ key: 'advanced' })) ?? {}

      await pluginStore.set({
        key: 'advanced',
        value: {
          ...advanced,
          allow_register: false,
          default_role: 'authenticated',
          unique_email: true,
        },
      })
    }

    for (const role of ROLES) {
      const roleId = await ensureRole(role)
      await ensurePermissions(roleId, role.permissions)
    }

    await ensureAdvancedSettings()
  },
}
