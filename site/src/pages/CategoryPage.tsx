import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ComingSoon } from "../components/ComingSoon";
import { categoryMeta, formatPostDate, postsIn } from "../content/posts";
import type { CategoryId } from "../content/types";

export function CategoryPage({ category }: { category: CategoryId }) {
  const meta = categoryMeta[category];
  const posts = postsIn(category);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const previous = document.title;
    document.title = `${meta.title} — kris10`;
    return () => {
      document.title = previous;
    };
  }, [meta.title]);

  useEffect(() => {
    if (posts.length === 0) return;
    window.scrollTo(0, 0);
    headingRef.current?.focus({ preventScroll: true });
  }, [posts.length, category]);

  if (posts.length === 0) {
    return <ComingSoon title={meta.title} />;
  }

  return (
    <main className="reading">
      <div className="sheet">
        <h1 ref={headingRef} tabIndex={-1}>
          {meta.title}
        </h1>
        <ul className="post-index">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link to={`${meta.path}/${post.slug}`}>
                <time dateTime={post.date}>{formatPostDate(post.date)}</time>
                <span className="post-index-title">{post.title}</span>
                <span className="post-index-summary">{post.summary}</span>
                <span className="read-cue">Read</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
