import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/posts',
  }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string().min(1)).default([]),
    category: z.enum(['AI 与技术', '数学与学习', '独立开发', '思考与生活']),
    lang: z.enum(['zh-CN', 'en']),
    translationKey: z.string().min(1),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
