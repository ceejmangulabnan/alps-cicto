/**
 * custom farm routes
 */

export default {
  type: "content-api" as const,
  routes: [
    {
      method: "GET",
      path: "/farms/with-summary",
      handler: "api::farm.custom-farm.findWithSummary",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "GET",
      path: "/farms/:id/with-summary",
      handler: "api::farm.custom-farm.findOneWithSummary",
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};

