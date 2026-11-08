import { lazy, Suspense, type ReactNode } from "react";
import type { Block, PostImage, StoreLink, TextPart } from "../content/types";

const HeadphoneTangleGame = lazy(() =>
  import("./HeadphoneTangleGame").then((m) => ({ default: m.HeadphoneTangleGame })),
);

function ExternalLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

function emphasize(text: string, keyPrefix: number) {
  const pattern = /\*([^*\n]+)\*/g;
  if (!pattern.test(text)) return text;
  pattern.lastIndex = 0;

  const nodes: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let count = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    nodes.push(<em key={`${keyPrefix}-${count}`}>{match[1]}</em>);
    last = pattern.lastIndex;
    count += 1;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function RichText({ parts }: { parts: TextPart[] }) {
  return parts.map((part, index) =>
    typeof part === "string" ? (
      emphasize(part, index)
    ) : (
      <ExternalLink key={`${part.href}-${index}`} href={part.href}>
        {part.text}
      </ExternalLink>
    ),
  );
}

function StoreName({ store }: { store: StoreLink }) {
  return store.href ? (
    <ExternalLink href={store.href}>{store.name}</ExternalLink>
  ) : (
    <span className="play-plain">{store.name}</span>
  );
}

function PlayOn({ stores }: { stores: StoreLink[] }) {
  return (
    <p className="play-line">
      Play on{" "}
      {stores.map((store, index) => {
        const last = index === stores.length - 1;
        if (!last || stores.length === 1) {
          return (
            <span key={store.name}>
              {index > 0 ? ", " : null}
              <StoreName store={store} />
            </span>
          );
        }
        return (
          <span key={store.name}>
            {stores.length > 2 ? ", " : " "}
            <span className="play-keep">
              and <StoreName store={store} />
            </span>
          </span>
        );
      })}
      .
    </p>
  );
}

function PostFigure({ image }: { image: PostImage }) {
  return (
    <figure>
      <img src={image.src} alt={image.alt} />
      <figcaption>Image credit: {image.credit}</figcaption>
    </figure>
  );
}

function Minigame({ id }: { id: string }) {
  if (id !== "headphone-tangling") return null;
  return (
    <Suspense fallback={<div className="tangle tangle-loading" />}>
      <HeadphoneTangleGame />
    </Suspense>
  );
}

export function PostBody({ blocks }: { blocks: Block[] }) {
  return (
    <div className="post-body">
      {blocks.map((block, index) => {
        if (block.type === "paragraph") {
          return (
            <p key={index}>
              <RichText parts={block.text} />
            </p>
          );
        }

        if (block.type === "image") {
          return <PostFigure key={index} image={block.image} />;
        }

        if (block.type === "minigame") {
          return <Minigame key={`minigame-${block.id}`} id={block.id} />;
        }

        return (
          <section className="game-entry" key={block.title}>
            <h2>
              <ExternalLink href={block.href}>{block.title}</ExternalLink>
            </h2>
            <PlayOn stores={block.stores} />
            <p>
              <RichText parts={block.text} />
            </p>
            {block.image ? <PostFigure image={block.image} /> : null}
          </section>
        );
      })}
    </div>
  );
}
