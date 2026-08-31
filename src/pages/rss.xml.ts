import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getPostPath, getPublishedPosts } from '../lib/posts';
import { SITE } from '../site.config';

export const GET: APIRoute = async (context) => {
  const posts = await getPublishedPosts();

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site ?? SITE.url,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.publishDate,
      link: getPostPath(post),
      categories: [post.data.category, ...post.data.tags],
    })),
    customData: '<language>zh-CN</language>',
  });
};
