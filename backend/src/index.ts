import type { Core } from "@strapi/strapi";

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
        name: "Administrator",
        type: "administrator",
        legacyNames: ["Admin", "Administrator"],
        legacyTypes: ["admin", "administrator"],
        permissions: [
          "plugin::users-permissions.user.find",
          "plugin::users-permissions.user.findOne",
          "plugin::users-permissions.user.create",
          "plugin::users-permissions.user.update",
          "plugin::users-permissions.user.destroy",
          "plugin::users-permissions.user.count",
          "plugin::users-permissions.user.me",
          "plugin::users-permissions.role.find",
          "plugin::users-permissions.role.findOne",
        ],
      },
      {
        name: "Authenticated",
        type: "authenticated",
        legacyNames: ["Authenticated"],
        legacyTypes: ["authenticated"],
        permissions: [
          "plugin::users-permissions.role.find",
          "plugin::users-permissions.user.me",
        ],
      },
    ];

    const findRole = (where: object) =>
      strapi.db.query("plugin::users-permissions.role").findOne({ where });

    const ensureRole = async ({
      name,
      type,
      legacyNames,
      legacyTypes,
    }: (typeof ROLES)[number]) => {
      const roleService = strapi.plugin("users-permissions").service("role");

      let role =
        (await findRole({ name: { $in: legacyNames } })) ??
        (await findRole({ type: { $in: legacyTypes } }));

      if (!role) {
        await roleService.createRole({ name, type });
        role = await findRole({ type });
      } else if (role.name !== name || role.type !== type) {
        role = await strapi.db.query("plugin::users-permissions.role").update({
          where: { id: role.id },
          data: { name, type },
        });
      }

      return role.id;
    };

    const ensurePermissions = async (roleId: number, actions: string[]) => {
      const existing = await strapi.db
        .query("plugin::users-permissions.permission")
        .findMany({ where: { role: { id: roleId } } });

      const existingActions = new Set(existing.map((p) => p.action));
      const missing = actions.filter((action) => !existingActions.has(action));

      if (missing.length > 0) {
        await Promise.all(
          missing.map((action) =>
            strapi.db.query("plugin::users-permissions.permission").create({
              data: { action, role: roleId },
            }),
          ),
        );
      }

      const stale = existing.filter(
        (permission) => !actions.includes(permission.action),
      );

      if (stale.length > 0) {
        await Promise.all(
          stale.map((permission) =>
            strapi.db
              .query("plugin::users-permissions.permission")
              .delete({ where: { id: permission.id } }),
          ),
        );
      }
    };

    const ensureAdvancedSettings = async () => {
      const pluginStore = strapi.store({
        type: "plugin",
        name: "users-permissions",
      });
      const advanced = (await pluginStore.get({ key: "advanced" })) ?? {};

      await pluginStore.set({
        key: "advanced",
        value: {
          ...advanced,
          allow_register: false,
          default_role: "authenticated",
          unique_email: true,
        },
      });
    };

    for (const role of ROLES) {
      const roleId = await ensureRole(role);
      await ensurePermissions(roleId, role.permissions);
    }

    await ensureAdvancedSettings();
  },
};
