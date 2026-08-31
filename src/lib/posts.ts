import { getCollection, type CollectionEntry } from 'astro:content';
import { CATEGORY_META, type CategoryName, type PostLanguage } from '../site.config';

export type Post = CollectionEntry<'posts'>;

export async function getPublishedPosts(): Promise<Post[]> {
  const posts = await getCollection('posts', ({ data }) => !data.draft);

  return posts.sort(
    (left, right) => right.data.publishDate.valueOf() - left.data.publishDate.valueOf(),
  );
}

export function getPostSlug(post: Post): string {
  return post.id
    .replace(/\.(md|mdx)$/u, '')
    .replace(/^zh-cn\//iu, '')
    .replace(/^en\//iu, '');
}

export function getPostPath(post: Post): string {
  const prefix = post.data.lang === 'en' ? '/en/posts/' : '/posts/';
  return `${prefix}${getPostSlug(post)}/`;
}

export function getCategoryPath(category: CategoryName): string {
  return `/categories/${CATEGORY_META[category].slug}/`;
}

export function getTagPath(tag: string): string {
  return `/tags/${encodeURIComponent(tag)}/`;
}

export function getReadingTime(body: string | undefined, lang: PostLanguage): number {
  const content = body ?? '';
  const cjkCharacters = content.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu)?.length ?? 0;
  const latinWords = content
    .replace(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu, ' ')
    .match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
  const minutes = cjkCharacters / 300 + latinWords / (lang === 'en' ? 220 : 200);

  return Math.max(1, Math.ceil(minutes));
}

export function formatDate(date: Date, lang: PostLanguage): string {
  return new Intl.DateTimeFormat(lang === 'en' ? 'en' : 'zh-CN', {
    year: 'numeric',
    month: lang === 'en' ? 'long' : 'long',
    day: 'numeric',
  }).format(date);
}

export function getLanguageLabel(lang: PostLanguage): string {
  return lang === 'en' ? 'English' : '中文';
}

export function findTranslation(posts: Post[], currentPost: Post): Post | undefined {
  return posts.find(
    (post) =>
      post.data.translationKey === currentPost.data.translationKey &&
      post.data.lang !== currentPost.data.lang,
  );
}

export function getPostNeighbors(posts: Post[], currentPost: Post) {
  const sameLanguagePosts = posts.filter((post) => post.data.lang === currentPost.data.lang);
  const index = sameLanguagePosts.findIndex((post) => post.id === currentPost.id);

  return {
    previousPost: index >= 0 ? sameLanguagePosts[index + 1] : undefined,
    nextPost: index > 0 ? sameLanguagePosts[index - 1] : undefined,
  };
}
