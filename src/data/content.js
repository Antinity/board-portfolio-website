/**
 * Everything the board says about you. Sourced from antinity-website.vercel.app
 * and github.com/antinity — edit freely; the board and the case files both read
 * from here. Images live in /public/evidence.
 */

export const subject = {
  name: "Lakshya Kumar",
  alias: "Antinity",
  age: 15,
  origin: "India",
  timezone: "IST (GMT+05:30)",
  activeSince: 2020,
  photo: "/evidence/avatar.jpg",
  photoCaption: "Last known photo",
  role: "Full-stack developer",
  tagline: "Obsessed with beautiful designs.",
  bio: [
    "15-year-old student and developer from India. Web dev since 2020.",
    "Works with JavaScript frameworks and scalable builds, plus design tools and video editing apps — motion graphics, video editing and visual design.",
    "Obsessed with clean UI, sharp details and fast UX.",
  ],
  traits: ["Clean UI", "Sharp details", "Fast UX", "Motion & video", "Ships fast"],
};

/** Paid / client work. `id`s are referenced by the board's red strings. */
export const projects = [
  {
    id: "nexora",
    title: "Nexora Visuals",
    kind: "React website",
    stack: ["React"],
    image: "/evidence/nexoravisuals.png",
    url: "https://nexoravisuals.vercel.app/",
    summary:
      "High-converting landing page for a content agency — polished UI, motion, clear service presentation and strong visual hierarchy.",
  },
  {
    id: "mtt",
    title: "Minemen Tier Tests",
    kind: "Next.js website",
    stack: ["Next.js"],
    image: "/evidence/mtt.png",
    url: "https://mtt-web.vercel.app/",
    summary: "Full-stack website for Minemen Tier Tests, written in Next.js.",
  },
  {
    id: "raam",
    title: "Rural Advertising & Marketing",
    kind: "VanillaJS website",
    stack: ["JavaScript"],
    image: "/evidence/raam.png",
    url: "https://www.ruraladvertisingandmarketing.com/",
    summary: "Marketing website built with vanilla JavaScript.",
  },
  {
    id: "unipower",
    title: "Unipower",
    kind: "PHP website",
    stack: ["PHP"],
    image: "/evidence/unipower.png",
    url: "https://myunipower.com/",
    summary: "PHP-based business website.",
  },
  {
    id: "mtl",
    title: "Minemen Tier List",
    kind: "PHP website",
    stack: ["PHP"],
    image: "/evidence/mtl.png",
    url: "https://mtl.babsoft.in/",
    summary: "PHP-based tier list website for a Minecraft PvP community.",
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

export const experience = [
  {
    id: "ghast",
    role: "Frontend Developer",
    company: "Ghast.io · Auraside",
    period: null, // add dates, e.g. "2024 — 2025"
    url: "https://ghast.io/",
    summary: "Ghast is a Windows app that optimises your network connection. Worked on the frontend app, implementing features.",
    highlights: [
      "Preset system",
      "Advanced configuration panel",
      "Contextual hover tooltips for better UX",
      "State management with Redux",
    ],
  },
  {
    id: "freelance",
    role: "Freelance Web Developer",
    company: "Independent",
    period: "2020 — Now",
    url: null,
    summary: "Websites and platforms for communities, agencies and businesses — from landing pages to full-stack apps.",
    highlights: ["Client sites in React, Next.js, PHP and vanilla JS", "Discord bots with discord.js"],
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

export const socials = [
  { id: "github", label: "GitHub", handle: "Antinity", url: "https://github.com/antinity" },
  { id: "discord", label: "Discord", handle: "antinity", url: "https://discord.com/users/255322229062107136" },
  { id: "server", label: "Discord server", handle: "discord.gg/SaHkUuWc2K", url: "https://discord.gg/SaHkUuWc2K" },
  { id: "x", label: "X", handle: "@antinityfx", url: "https://x.com/antinityfx" },
];
