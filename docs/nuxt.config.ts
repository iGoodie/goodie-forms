export default defineNuxtConfig({
  modules: ["@nuxt/ui"],
  css: ["~/assets/css/main.css"],
  content: {
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
