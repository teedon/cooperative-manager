interface StorybookConfig {
  stories: string[];
  addons: string[];
}

const config: StorybookConfig = {
  stories: ['../src/components/**/*.stories.?(ts|tsx|js|jsx)'],
  addons: [],
};

export default config;
