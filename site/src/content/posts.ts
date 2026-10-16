import type { CategoryId, Post } from "./types";
import { favoriteGames2026 } from "./posts/favorite-games-2026";

export const categoryMeta: Record<
  CategoryId,
  { title: string; path: string }
> = {
  games: { title: "Games", path: "/games" },
  books: { title: "Books", path: "/books" },
  other: { title: "Other", path: "/other" },
};

const posts: Post[] = [favoriteGames2026];

export function postsIn(category: CategoryId) {
  return posts
    .filter((post) => post.category === category)
    .sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
}

export function findPost(category: CategoryId, slug: string) {
  return posts.find((post) => post.category === category && post.slug === slug);
}

export function formatPostDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}
