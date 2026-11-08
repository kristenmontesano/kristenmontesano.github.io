import type { Post } from "../types";

const steam = (appId: string, slug: string) =>
  `https://store.steampowered.com/app/${appId}/${slug}/`;

const shot = (file: string) => `/images/${encodeURIComponent(file)}`;

export const consumeMe: Post = {
  slug: "consume-me",
  category: "games",
  title: "Consume Me: A Charming Time Management, Minigame-Rich Story",
  date: "2026-11-08",
  summary:
    "A short, tightly crafted story game where time management and cute minigames make you feel the stresses and joys our character feels, while also making you complicit in their unhealthy habits.",
  blocks: [
    {
      type: "paragraph",
      text: [
        {
          text: "Consume Me",
          href: steam("2359120", "Consume_Me"),
        },
        " is very likely my game of the year for 2026 (it came out in 2025, but I only got around to playing it a couple months ago). As much as I laugh at myself for clicking through dialogue in many games, I do love a good story game, and this story was relatable, touching, funny, and just a joy to play through. It was also a short game, which I really appreciated: no bloat, no mechanics that exist almost exclusively to keep you playing longer, no side quests for the completionist that don't have much to do with the story. The story and mechanics are tight and well executed.",
      ],
    },
    {
      type: "image",
      image: {
        src: shot("Consume_Me_Full_Plate.png"),
        alt: "A full plate of food arranged for one of Consume Me’s dieting minigames.",
        credit: "Steam",
      },
    },
    {
      type: "paragraph",
      text: [
        "I won’t make you search for the headline here: Consume Me succeeds because, as a story about our character’s coming-of-age struggles, it forces the player to experience those struggles through its mechanics, rather than just telling us a story about them.",
      ],
    },
    {
      type: "paragraph",
      text: [
        "A semi-autobiographical story about one of its developers, Consume Me follows Jenny, a high school aged girl plagued with an increasingly busy schedule. Between dieting and working out to impress her hot-neighbor crush, doing homework, studying, laundry, walking the dog, cleaning the bathroom, and helping her grandparents, she has a truly ridiculous mountain of tasks. Each day, we have a certain amount of free time, certainly not enough to complete everything, and each task is assigned a time commitment. The time-management system alone is well done. Our screen is cleverly split into three sections, with a third dedicated to an always-visible list of tasks, goals, and gauges, and the other two-thirds serving as the game stage.",
      ],
    },
    {
      type: "image",
      image: {
        src: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2359120/b4217780c82410e81a7842d9d28d019e84a7dd08/ss_b4217780c82410e81a7842d9d28d019e84a7dd08.1920x1080.jpg?t=1758745344",
        alt: "Jenny’s bedroom game stage beside an always-visible list of tasks, goals, and gauges.",
        credit: "Steam",
      },
    },
    {
      type: "paragraph",
      text: [
        "The coming-of-age story is both charming and painfully relatable. Jenny becomes increasingly self-conscious, developing an unhealthy obsession with her weight, dieting, and exercise. At the same time, she hardly has time to be worrying about all that! Every day, new responsibilities seem to pile on when yesterday's were already too much. She's trying to get into some top universities, which means endless studying, homework, and test prep. She has a strict mom who is always on her about chores, while also attempting to maintain a social life and keep up with friendships. We see her be a bad, overly competitive friend, and can both understand where she's coming from and recognize where she's messed up. We're happy for her when she starts dating her crush, but with an undercurrent of worry as his priorities are revealed to be not quite what we thought, and potentially damaging to our already fragile Jenny. If the demands of approaching adulthood, managing high school, and dieting weren't enough, the transition to college piles on even more challenges and responsibilities.",
      ],
    },
    {
      type: "image",
      image: {
        src: shot("Consume_Me_Boyfriend.png"),
        alt: "Jenny spending time with her boyfriend during a story beat in Consume Me.",
        credit: "Steam",
      },
    },
    {
      type: "paragraph",
      text: [
        "The art style is aggressively cute and whimsical, nicely balancing the darker subject matter at the heart of the story. Gameplay is broken up with various cutscenes that I found touching, sad, or hilarious at different points. The dialogue is witty and sharp, and the characters feel like real people, each with their own virtues and flaws. The story doesn't shy away from Jenny's struggles, but neither does it overindulge in their darkness.",
      ],
    },
    {
      type: "paragraph",
      text: [
        "While the story is compelling on its own, the minigames are the star of the show. There are so many of them, and their short durations, combined with the rotation of different games throughout the story, mean they never feel stale. The influence of games like ",
        {
          text: "Florence",
          href: steam("1102130", "Florence"),
        },
        " is clear, but I find Consume Me's execution to be among the best of the best. The minigames make sense in the context of the story, and their mechanics often mirror what Jenny is experiencing.",
      ],
    },
    {
      type: "image",
      image: {
        src: shot("Consume_Me_Reading_Minigame.png"),
        alt: "Top-down reading minigame with Jenny’s spinning head trying to stay focused on her books.",
        credit: "Steam",
      },
    },
    {
      type: "paragraph",
      text: [
        "In the reading minigame, we play from a top-down view, with Jenny's head constantly rotating. We must try to change its direction (clockwise or counter-clockwise) at the right time and often enough to keep her eyes focused on her books. Distracting thoughts fly in from nowhere, about her crush, her dog, and everything else competing for her attention, and we must avoid looking at them! As part of her dieting minigames, we play a Tetris-inspired game where we must fit the right foods together to keep Jenny both full enough and under her \"bite par.\" To play the workout minigame, we contort her wobbly arms into the right yoga poses to burn \"bites.\" Cleaning the bathroom involves a time-trial minigame with yucky green dirt and a tiny, purposefully loosely controlled scrub brush. They're all silly and fun little games in their own right, but they also make us feel what Jenny is feeling. I found myself stressing, just for a few seconds, over these minigames, trying to make the most of the allotted time to help my overextended character work toward her goals.",
      ],
    },
    {
      type: "image",
      image: {
        src: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2359120/f0a777dee83cd4b971c46a39341db70847c98806/ss_f0a777dee83cd4b971c46a39341db70847c98806.1920x1080.jpg?t=1758745344",
        alt: "One of Consume Me’s minigames playing out beside Jenny’s daily task list.",
        credit: "Steam",
      },
    },
    {
      type: "paragraph",
      text: [
        "And this is where Consume Me's design is at its best. The player is given enough autonomy to manage Jenny's day - barely! - but not enough time to do everything. We have to make decisions about what matters most, what can be sacrificed, and when to push Jenny past her limits. Should you force Jenny to have three energy drinks tonight and stay up late so that you can give yourself more time to finish assignments and maintain your long-distance relationship? Pushing her energy and happiness bars down might be the only way to achieve your goals in this time-management sim, but it feels appropriately wrong and stress-inducing. We're forced to make questionable decisions, despite only wanting to help our character. It's a clever way of making the player complicit in Jenny's increasingly unhealthy habits. We're not just watching her struggle to keep up with everything; we are directly contributing to that struggle.",
      ],
    },
    {
      type: "paragraph",
      text: [
        "Pacing is incredibly well done, too. The variety of minigames keeps things fresh, and just as we might start to get sick of them, the story transitions us into the next chapter, with a fresh set of tasks, goals, and minigames. The game knows when to move on, and its brevity is one of its strengths.",
      ],
    },
    {
      type: "image",
      image: {
        src: shot("Consume_Me_Minigames.png"),
        alt: "A collage of Consume Me’s varied story-tied minigames.",
        credit: "Steam",
      },
    },
    {
      type: "paragraph",
      text: [
        "I won't spoil the ending, but a quick search indicated that some players found it controversial or a cop-out. I disagree. This story was never about us, and given its known autobiographical nature, I thought the ending made good sense. I found it to be a moving conclusion to Jenny's story. I was completely captured when the cutscene leading into the ending started and I realized where it was going. While the game did sort of lead us to believe that our decisions were consequential and could easily be interpreted to mean that there are multiple true endings, it never lied to us about being Jenny, the developer’s, story. How could that have multiple endings?",
      ],
    },
    {
      type: "paragraph",
      text: [
        "Ultimately, what makes Consume Me such a winner is the authenticity and care put into every little detail. The story and characters are charming, the gameplay is fun and varied, and the mechanics are so thoughtfully integrated with the narrative that I couldn't help but feel what Jenny was feeling. All of this could add up to a not-very-fun life sim, but I was completely addicted to the game and had a blast playing through it, laughing and crying through cutscenes with my Steam Deck firmly glued to my hands.",
      ],
    },
  ],
};
