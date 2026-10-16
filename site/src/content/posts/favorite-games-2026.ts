import type { Post } from "../types";

const steam = (appId: string, slug: string) =>
  `https://store.steampowered.com/app/${appId}/${slug}/`;

const shot = (file: string) => `/images/${encodeURIComponent(file)}`;

export const favoriteGames2026: Post = {
  slug: "favorite-games-2026",
  category: "games",
  title: "Intro and favorite games played this year",
  date: "2026-10-15",
  summary: "A first list of my favorite games played this year.",
  blocks: [
    {
      type: "paragraph",
      text: [
        "I'm Kristen Vassalli, and I love games and books, among other things. I've been making games professionally since 2021, but I've been playing them obsessively since 2005, when my grandma heard that the Game Boy Advance SP was all the rage and sent me one (thanks, Grandma!).",
      ],
    },
    {
      type: "paragraph",
      text: [
        "Lately, I've been playing a lot of wonderful games and reading a lot of fantastic books. With a new pocket of free time in my life, I figured it was a good opportunity to sit down and write about what makes my favorites so special. As someone who works in a creative field, I think there's a lot to gain from going beyond just intuiting what makes something special, and actually thinking deeply and putting into words why something works so well.",
      ],
    },
    {
      type: "paragraph",
      text: ["So here we are!"],
    },
    {
      type: "paragraph",
      text: [
        "I’m letting myself off easy with this first writing, just to get the ball rolling, since I’d need to review and plan out which games I want to write more about. Of the games I played in 2026, here is a list of my favorites. Hopefully I’ll be writing a bit on each of these!",
      ],
    },
    {
      type: "game",
      title: "Consume Me",
      href: steam("2359120", "Consume_Me"),
      stores: [
        { name: "Steam", href: steam("2359120", "Consume_Me") },
        {
          name: "iPhone & iPad",
          href: "https://apps.apple.com/us/app/consume-me/id6769877287",
        },
      ],
      text: [
        "Probably my favorite of the year. A time-management story game with some of the best thematic minigames that tie the story and gameplay together so well. This game really makes you feel what the creators wanted you to feel, through the gameplay. Mini games are stressful when our character is stressed, hard to control when she’s distracted, and so on. I anticipate I’ll write up a longer review on this one first. Delightful.",
      ],
      image: {
        src: shot("Consume Me.png"),
        alt: "Jenny exercising in her bedroom beside a to-do list of goals, chores, and errands.",
        credit: "Steam",
      },
    },
    {
      type: "game",
      title: "Red Dead Redemption II",
      href: steam("1174180", "Red_Dead_Redemption_2"),
      stores: [
        { name: "Steam", href: steam("1174180", "Red_Dead_Redemption_2") },
        {
          name: "PlayStation",
          href: "https://www.playstation.com/en-us/games/red-dead-redemption-2/",
        },
        {
          name: "Xbox",
          href: "https://www.xbox.com/en-US/games/red-dead-redemption-2",
        },
      ],
      text: [
        "A very American western game in which you play as a gunslinging, horse riding Arthur Morgan in a gang of outlaws. Robbing trains has never been more fun! I’m not the biggest fan of open world games, but this one really hit for me. It’s everything you want from a studio as big as Rockstar, and they delivered.",
      ],
      image: {
        src: shot("Red Dead Redemption II.png"),
        alt: "Arthur Morgan riding away on horseback through a pine forest toward a lake and rocky cliffs.",
        credit: "Rockstar",
      },
    },
    {
      type: "game",
      title: "Time Flies",
      href: steam("2000120", "Time_Flies"),
      stores: [
        { name: "Steam", href: steam("2000120", "Time_Flies") },
        {
          name: "PlayStation",
          href: "https://store.playstation.com/en-us/product/UP3971-PPSA18530_00-0736036200626090/",
        },
        {
          name: "Switch",
          href: "https://www.nintendo.com/us/store/products/time-flies-switch/",
        },
        { name: "Mac" },
        { name: "Epic" },
      ],
      text: [
        "How’s your bucket list looking? Good thing you’ve got a lot more time to achieve your goals than fly. A delightful little puzzle-discovery roguelike. Figure out what cleverly-named bucket list items really mean (“Just Roll with It?” What do I do for that one? Spoiler: You land on a toilet paper roll and walk it like a treadmill) and then cross off all of the items on the list in one 80-second lifespan run! Short games can be amazing. In fact, I’m particularly drawn to them.",
      ],
      image: {
        src: shot("Time Flies.png"),
        alt: "Black and white pixel art. A tiny fly next to an acoustic guitar, with 58.2 seconds remaining.",
        credit: "Steam",
      },
    },
    {
      type: "game",
      title: "Slay the Spire II",
      href: steam("2868840", "Slay_the_Spire_2"),
      stores: [
        {
          name: "Steam (early access)",
          href: steam("2868840", "Slay_the_Spire_2"),
        },
      ],
      text: [
        "It’s ",
        {
          text: "Slay the Spire",
          href: steam("646570", "Slay_the_Spire"),
        },
        " with barely any changes, but why fix what ain’t broken, right? I spent an inexplicable number of hours on this sequel especially given the minimal differences from the original. Much like ",
        {
          text: "Hades II",
          href: steam("1145350", "Hades_II"),
        },
        " last year, this game has proven that a sequel doesn’t always have to be radically different from its predecessor. If people want more of your winning formula, give it to them!",
      ],
      image: {
        src: shot("Slay the Spire II.png"),
        alt: "The Necrobinder, a skeletal character in a red cloak, on the character select screen.",
        credit: "Steam",
      },
    },
    {
      type: "game",
      title: "Death Howl",
      href: steam("2825880", "Death_Howl"),
      stores: [
        { name: "Steam", href: steam("2825880", "Death_Howl") },
        {
          name: "PlayStation",
          href: "https://store.playstation.com/en-us/product/UP4361-PPSA30896_00-0258167813341496",
        },
        {
          name: "Xbox",
          href: "https://www.xbox.com/en-US/games/store/death-howl/9pd9szgncmdz",
        },
        {
          name: "Switch",
          href: "https://www.nintendo.com/us/store/products/death-howl-switch/",
        },
      ],
      text: [
        "I like hard games that make you try over and over again to beat the level, and this is that. If ",
        {
          text: "Into the Breach",
          href: steam("590380", "Into_the_Breach"),
        },
        " was a deckbuilder with an open world it would be this. Made me bash my head into the wall many times. Just one more attempt and I’ll get it… Also, gorgeous pixel art, which I am a sucker for. That’s 5 stars for me!",
      ],
      image: {
        src: shot("Death Howl.png"),
        alt: "A pixel-art grid battle against mushroom creatures in a dark forest.",
        credit: "Steam",
      },
    },
    {
      type: "game",
      title: "Despelote",
      href: steam("2367820", "despelote"),
      stores: [
        { name: "Steam", href: steam("2367820", "despelote") },
        {
          name: "PlayStation",
          href: "https://store.playstation.com/en-us/product/UP3971-PPSA15428_00-0434180303206305",
        },
        {
          name: "Xbox",
          href: "https://www.xbox.com/en-us/games/store/despelote/9PCS3Q4JSCVV",
        },
        {
          name: "Switch",
          href: "https://www.nintendo.com/us/store/products/despelote-switch/",
        },
        {
          name: "Mac",
          href: "https://apps.apple.com/us/app/despelote/id6747992743?mt=12",
        },
      ],
      text: [
        "Another charming story game. Maybe not even a game - more of an interactive, immersive story experience? Unique and lovely to look at and listen to. A well executed unique idea is usually going to rate well with me, as was the case here. And while you don’t have to love soccer to love this soccer-themed story, I’m the type of psychotic person who plays on 4 different weekly rec league teams, so that really worked for me!",
      ],
      image: {
        src: shot("Despelote.png"),
        alt: "A first-person view of kids playing soccer in a city plaza. A speech bubble reads, “We’ve never qualified. But we never lose faith, you know?”",
        credit: "Steam",
      },
    },
  ],
};
