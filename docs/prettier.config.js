export default {
  plugins: ["prettier-plugin-mdc"],
  overrides: [
    {
      files: ["*.md"],
      options: {
        parser: "mdc",
      },
    },
  ],
};