import { useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { PostBody } from "../components/PostBody";
import {
  categoryMeta,
  findPost,
  formatPostDate,
  postsIn,
} from "../content/posts";
import type { CategoryId } from "../content/types";

function useReadingTitle(title: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = `${title} — kris10`;
    return () => {
      document.title = previous;
    };
  }, [title]);
}

export function PostPage({ category }: { category: CategoryId }) {
  const { slug = "" } = useParams();
  const meta = categoryMeta[category];
  const post = findPost(category, slug);
  const others = postsIn(category).filter((item) => item.slug !== slug);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useReadingTitle(post ? post.title : meta.title);

  useEffect(() => {
    window.scrollTo(0, 0);
    headingRef.current?.focus({ preventScroll: true });
  }, [slug]);

  if (!post) {
    return (
      <main className="reading">
        <article className="sheet">
          <p className="back-row">
            <Link to={meta.path}>{meta.title}</Link>
          </p>
          <h1 ref={headingRef} tabIndex={-1}>
            Missing post
          </h1>
          <p>That writing isn’t on this page.</p>
        </article>
      </main>
    );
  }

  return (
    <main className="reading">
      <article className="sheet">
        <p className="back-row">
          <Link to={meta.path}>{meta.title}</Link>
        </p>
        <time dateTime={post.date}>{formatPostDate(post.date)}</time>
        <h1 ref={headingRef} tabIndex={-1}>
          {post.title}
        </h1>
        <PostBody blocks={post.blocks} />
        {others.length > 0 ? (
          <nav className="more-posts" aria-label={`More in ${meta.title}`}>
            <h2>More in {meta.title}</h2>
            <ul>
              {others.map((item) => (
                <li key={item.slug}>
                  <Link to={`${meta.path}/${item.slug}`}>
                    <time dateTime={item.date}>{formatPostDate(item.date)}</time>
                    <span>{item.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </article>
    </main>
  );
}
