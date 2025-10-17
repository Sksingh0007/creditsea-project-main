module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: { node: "current" },
        modules: "auto",
      },
    ],
    [
      "@babel/preset-react",
      {
        runtime: "automatic",
      },
    ],
  ],
  plugins: [
    // Add this plugin to transform import.meta
    function () {
      return {
        visitor: {
          MetaProperty(path) {
            path.replaceWithSourceString("process");
          },
        },
      };
    },
  ],
};
