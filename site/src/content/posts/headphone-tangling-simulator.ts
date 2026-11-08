import type { Post } from "../types";

export const headphoneTanglingSimulator: Post = {
  slug: "headphone-tangling-simulator",
  category: "other",
  title: "Headphone Tangling Simulator",
  date: "2026-11-08",
  summary:
    "A silly pocket minigame: drag your earbuds and try to tangle them as much as possible before time runs out.",
  actionLabel: "Play",
  blocks: [
    {
      type: "paragraph",
      text: [
        "You know the bit where you pull your headphones out of your pocket and they’ve somehow become a small cursed knot? This is that, but on purpose.",
      ],
    },
    {
      type: "paragraph",
      text: [
        "Grab the earbuds, the jack, or any bit of cord and drag it around the pocket. You’ve got *20 seconds* to make as many tangles in the cable as you can. Go forth and ruin a perfectly good pair of headphones.",
      ],
    },
    {
      type: "minigame",
      id: "headphone-tangling",
    },
  ],
};
