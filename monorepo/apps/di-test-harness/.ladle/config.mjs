export default {
  stories: "stories/**/*.stories.{js,jsx,ts,tsx}",
  defaultStory: "simple-animal-transformation",
  addons: {
    control: {
      enabled: false
    },
    action: {
      enabled: true
    }
  },
  viteConfig: {
    resolve: {
      alias: {
        '@': '/src'
      }
    }
  },
  storyOrder: [
    "simple-animal-transformation",
    "multi-animal-transformation"
  ]
};
