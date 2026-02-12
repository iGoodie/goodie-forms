export default defineNuxtConfig({
  modules: ["@nuxt/ui"],
  css: ["~/assets/css/main.css"],
  content: {
    documentDriven: true,
    navigation: true,
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
