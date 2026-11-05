/**
 * Everything the board says about you. Sourced from antinity-website.vercel.app
 * and github.com/antinity — edit freely; the board and the case files both read
 * from here. Images live in /public/evidence.
 */

export const subject = {
  name: "Lakshya Kumar",
  firstName: "Lakshya",
  alias: "Antinity",
  origin: "India",
  timezone: "IST (GMT+05:30)",
  activeSince: 2020,
  photo: "/evidence/avatar.jpg",
  role: "Full-stack developer & designer",
  intro:
    "I'm a full-stack developer & designer. I collaborate with companies to craft memorable user experiences, bringing their vision with attention to small details.",
  bio: [
    "Hello, I'm Lakshya! A developer & designer who likes playing with stuff, understanding how it works, and figuring out how to make it work better.",
    "I enjoy building things and making them look great inside and out. I'm big on the little details too, from subtle interactions to the overall vibe an interface brings.",
    "A lot of my ideas come from what I do in my free time: gaming, visual design, playing with computers, and occasionally dismantling them just to see how they're made.",
  ],
  traits: ["Clean UI", "Sharp details", "Fast UX", "Motion & video", "Ships fast"],
};

/**
 * Selected works (from the prototype site's works table). `image` is a
 * screenshot in /public/evidence, or null until one is added — the board
 * then shows a "file pending" print instead of a fake screenshot.
 * `id`s are referenced by the board's red strings.
 */
export const works = [
  {
    id: "ghast",
    title: "Ghast.io",
    location: "England",
    services: "Development",
    year: 2025,
    url: "https://ghast.io/",
    image: null,
    summary: "Major frontend updates for a Windows network-optimisation app: a preset system, an advanced configuration panel and contextual hover tooltips, with Redux for state.",
  },
  {
    id: "mtl",
    title: "Minemen Tier List",
    location: "Sri Lanka",
    services: "Design & Development",
    year: 2025,
    url: "https://mtl.babsoft.in/",
    image: "/evidence/mtl.png",
    summary: "Tier list website for a Minecraft PvP community.",
  },
  {
    id: "mtt",
    title: "Minemen Tier Tests",
    location: "India",
    services: "Design & Development",
    year: 2025,
    url: "https://mtt-web.vercel.app/",
    image: "/evidence/mtt.png",
    summary: "Full-stack website for Minemen Tier Tests, written in Next.js.",
  },
  {
    id: "tiertests",
    title: "Tier Tests",
    location: "United States",
    services: "Design & Development",
    year: 2025,
    url: "https://tiertests.com/",
    image: null,
    summary: "A full platform: animated landing page, live results feed, store, global leaderboards across game modes, markdown resources and customisable profiles.",
  },
  {
    id: "nexora",
    title: "Nexora Visuals",
    location: "Slovenia",
    services: "Design & Development",
    year: 2025,
    url: "https://nexoravisuals.vercel.app/",
    image: "/evidence/nexoravisuals.png",
    summary: "Landing page for a content agency, focused on polished UI, motion, clear service presentation and strong visual hierarchy.",
  },
  {
    id: "packs",
    title: "Packs",
    location: "United States",
    services: "Design",
    year: 2026,
    url: null,
    image: null,
    summary: null,
  },
  {
    id: "library",
    title: "Library Page",
    location: "India",
    services: "Design",
    year: 2025,
    url: null,
    image: null,
    summary: null,
  },
  {
    id: "cjp",
    title: "Cockroach Janta Party",
    location: "India",
    services: "Design & Development",
    year: 2026,
    url: null,
    image: null,
    summary: "Official website for Cockroach Janta Party.",
  },
  {
    id: "whatnow",
    title: "WhatNow",
    location: "India",
    services: "Development",
    year: 2025,
    url: "https://whatnow-web.vercel.app",
    image: null,
    summary: "Career guidance platform helping students make better decisions at different stages of life.",
  },
];

/** The to-do list: shipped (done) and currently building (open). */
export const operations = [
  {
    id: "op-tiertests",
    title: "TierTests",
    done: true,
    url: "https://tiertests.com/",
    summary:
      "Full platform ecosystem — animated landing page, live results feed, functional store, global leaderboards with multiple game modes, markdown-powered resources, customisable user profiles and social features.",
  },
  {
    id: "op-nexora",
    title: "NexoraVisuals",
    done: true,
    url: "https://nexoravisuals.vercel.app/",
    summary: "Landing page for a content agency, focused on polish, motion and visual hierarchy.",
  },
  {
    id: "op-ghast",
    title: "Ghast.io frontend",
    done: true,
    url: "https://ghast.io/",
    summary: "Preset system, advanced configuration panel and contextual hover tooltips (Redux).",
  },
  {
    id: "op-whatnow",
    title: "WhatNow",
    done: false,
    url: "https://whatnow-web.vercel.app",
    summary: "Career guidance platform helping students make better decisions at different stages of life.",
  },
  {
    id: "op-proklok",
    title: "Proklok",
    done: false,
    url: "https://proklok.vercel.app/",
    summary: "AI-first all-in-one tool for landlords to manage rentals, PGs, hostels and flats.",
  },
  {
    id: "op-ytr",
    title: "YouTube Reimagined",
    done: false,
    url: "https://github.com/Antinity/youtube-reimagined",
    summary: "Customisable YouTube extension with community-made plugins and themes.",
  },
];

/** Client statements. `about` links each to a project / job on the board. */
export const witnesses = [
  {
    id: "jbablestime",
    name: "Jbablestime",
    role: "Owner",
    org: "Ghast.io",
    about: "ghast",
    statement:
      "Working with Antinity on the Ghast.io project was awesome — super fast, efficient, and nailed the final product perfectly. Definitely raised the whole game.",
  },
  {
    id: "nsrd",
    name: "NSRD",
    role: "Owner",
    org: "Minemen Tier List",
    about: "mtl",
    statement:
      "I ordered a website for my discord server from Antinity, and I was very impressed with the quality of the work. The website was delivered in a week and was exactly what I wanted. Antinity was also very responsive to my feedback and made changes as needed. I would definitely recommend.",
  },
  {
    id: "zackaria",
    name: "Zackaria",
    role: "Owner",
    org: "Bridger Land",
    about: null,
    statement:
      "Antinity helped me setup a website for my Minecraft server, quickly and smoothly. He also helped fix an unrelated issue where users weren't receiving confirmation emails upon signing up. I would recommend working with him!",
  },
];

export const stack = [
  { group: "Languages", items: ["HTML", "CSS", "JavaScript", "TypeScript", "PHP", "Python", "C++"] },
  { group: "Frameworks", items: ["Next.js", "React", "Electron", "Laravel", "Express", "Tailwind", "discord.js"] },
  { group: "Data", items: ["Supabase", "MongoDB", "PostgreSQL", "Redis"] },
  { group: "Tools", items: ["VS Code", "Git", "Photoshop", "Premiere Pro", "After Effects", "Figma", "Notion", "Blender"] },
];

export const contact = {
  email: "antinityfx@gmail.com",
  note: "Let's work together!",
  timezone: "IST (GMT+05:30)",
};

/**
 * Socials. `icon` socials are drawn on the board in marker and link straight
 * to the profile. Instagram and WhatsApp are left out until there are links.
 */
export const socials = [
  { id: "x", label: "X", handle: "@antinityfx", url: "https://x.com/antinityfx", icon: true },
  { id: "linkedin", label: "LinkedIn", handle: "Lakshya Kumar", url: "https://www.linkedin.com/in/lakshya-kumar-594253314/", icon: true },
  { id: "github", label: "GitHub", handle: "Antinity", url: "https://github.com/antinity", icon: true },
  { id: "discord", label: "Discord", handle: "antinity", url: "https://discord.com/users/255322229062107136" },
];
