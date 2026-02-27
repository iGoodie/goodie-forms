export default defineNuxtConfig({
  app: {
    baseURL: "/goodie-forms/",
    buildAssetsDir: "assets",
    head: {
      link: [
        {
          rel: "icon",
          type: "image/x-icon",
          href: "/goodie-forms/favicon.ico",
        },
      ],
    },
  },
  routeRules: {
    "/**": { static: true },
  },
  modules: ["@nuxt/ui"],
  css: ["~/assets/css/main.css", "~/assets/css/scrollbar.css"],
  content: {
    base: "/goodie-forms/__nuxt_content",
    documentDriven: true,
    navigation: true,
    build: {
      markdown: {
        highlight: {
          langs: [
            "json",
            "js",
            "ts",
            "tsx",
            "html",
            "css",
            "vue",
            "shell",
            "mdc",
            "md",
            "yaml",
          ],
        },
      },
    },
  },
  icon: {
    customCollections: [
      {
        prefix: "goodie",
        dir: "./assets/icons",
        normalizeIconName: false,
      },
    ],
  },
});
