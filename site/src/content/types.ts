export type CategoryId = "games" | "books" | "other";

export type StoreLink = {
  name: string;
  href?: string;
};

export type PostImage = {
  src: string;
  alt: string;
  credit: string;
};

export type TextPart = string | { text: string; href: string };

export type ParagraphBlock = {
  type: "paragraph";
  text: TextPart[];
};

export type GameBlock = {
  type: "game";
  title: string;
  href: string;
  stores: StoreLink[];
  text: TextPart[];
  image?: PostImage;
};

export type ImageBlock = {
  type: "image";
  image: PostImage;
};

export type MinigameId = "headphone-tangling";

export type MinigameBlock = {
  type: "minigame";
  id: MinigameId;
};

export type Block = ParagraphBlock | GameBlock | ImageBlock | MinigameBlock;

export type Post = {
  slug: string;
  category: CategoryId;
  title: string;
  date: string;
  summary: string;
  /** Index cue label; defaults to "Read". */
  actionLabel?: string;
  blocks: Block[];
};
