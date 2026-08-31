export const SITE = {
  title: '树哥的地下室',
  englishTitle: "Notes from Shu's Basement",
  subtitle: 'AI、数学、独立开发与生活笔记',
  englishSubtitle: 'Notes on AI, mathematics, indie development, and life.',
  description: '林榕健的个人博客，记录 AI、数学、独立开发与生活。',
  url: 'https://machinegunlin.github.io',
} as const;

export const CATEGORY_META = {
  'AI 与技术': {
    slug: 'ai-and-technology',
    description: '模型、工程、工具，以及真实使用后的记录。',
  },
  '数学与学习': {
    slug: 'mathematics-and-learning',
    description: '数学学习过程、方法和没有想明白的问题。',
  },
  独立开发: {
    slug: 'indie-development',
    description: '从需求、开发到上架、Marketing 和复盘。',
  },
  思考与生活: {
    slug: 'thoughts-and-life',
    description: '工作以外的阅读、判断和日常笔记。',
  },
} as const;

export type CategoryName = keyof typeof CATEGORY_META;
export type PostLanguage = 'zh-CN' | 'en';
