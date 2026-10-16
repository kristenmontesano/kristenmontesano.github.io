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

export type Block = ParagraphBlock | GameBlock;

export type Post = {
  slug: string;
  category: CategoryId;
  title: string;
  date: string;
  summary: string;
  blocks: Block[];
};
