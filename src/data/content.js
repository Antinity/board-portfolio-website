/**
 * All portfolio content lives here. Edit this file to fill in your own details —
 * the board and the expanded case files both read from it.
 *
 * Any `image` field can be set to a path in /public (e.g. "/photos/me.jpg").
 * When left `null`, a generated placeholder snapshot is shown instead.
 */

export const caseInfo = {
  caseNumber: "0451",
  name: "Your Name",
  firstName: "Your",
  title: "Creative Developer",
  status: "Open",
  opened: "2026",
};

export const profile = {
  image: null,
  alias: "The Developer",
  occupation: "Creative Developer",
  location: "City, Country",
  status: "Available for work",
  languages: "English, ...",
  summary: [
    "Placeholder bio. Write two or three sentences about who you are, what you build, and what drives you.",
    "Add a second paragraph about your approach, the kind of teams you thrive in, or what you are looking for next.",
  ],
  traits: ["Detail obsessed", "Ships fast", "Curious", "Team player"],
};

export const experience = [
  {
    id: "exp-1",
    role: "Senior Developer",
    company: "Company One",
    period: "2024 — Now",
    location: "Remote",
    summary: "Placeholder description of the role and the impact you had.",
    highlights: ["Key achievement one", "Key achievement two", "Key achievement three"],
  },
  {
    id: "exp-2",
    role: "Frontend Developer",
    company: "Company Two",
    period: "2022 — 2024",
    location: "City",
    summary: "Placeholder description of the role and the impact you had.",
    highlights: ["Key achievement one", "Key achievement two"],
  },
  {
    id: "exp-3",
    role: "Junior Developer",
    company: "Company Three",
    period: "2020 — 2022",
    location: "City",
    summary: "Placeholder description of the role and the impact you had.",
    highlights: ["Key achievement one", "Key achievement two"],
  },
  {
    id: "exp-4",
    role: "Intern",
    company: "Company Four",
    period: "2019 — 2020",
    location: "City",
    summary: "Placeholder description of the role and the impact you had.",
    highlights: ["Key achievement one"],
  },
];

export const projects = [
  {
    id: "proj-1",
    title: "Project Alpha",
    year: "2026",
    role: "Lead Developer",
    image: null,
    stack: ["Next.js", "WebGL", "GSAP"],
    summary: "One-line pitch for the project.",
    description:
      "Placeholder case-study text. Describe the problem, your approach, and the outcome. Mention numbers if you have them.",
    link: "https://example.com",
  },
  {
    id: "proj-2",
    title: "Project Bravo",
    year: "2025",
    role: "Full-stack",
    image: null,
    stack: ["React", "Node", "PostgreSQL"],
    summary: "One-line pitch for the project.",
    description:
      "Placeholder case-study text. Describe the problem, your approach, and the outcome. Mention numbers if you have them.",
    link: "https://example.com",
  },
  {
    id: "proj-3",
    title: "Project Charlie",
    year: "2024",
    role: "Design & Dev",
    image: null,
    stack: ["Svelte", "Three.js"],
    summary: "One-line pitch for the project.",
    description:
      "Placeholder case-study text. Describe the problem, your approach, and the outcome. Mention numbers if you have them.",
    link: "https://example.com",
  },
  {
    id: "proj-4",
    title: "Project Delta",
    year: "2023",
    role: "Frontend",
    image: null,
    stack: ["TypeScript", "Tailwind"],
    summary: "One-line pitch for the project.",
    description:
      "Placeholder case-study text. Describe the problem, your approach, and the outcome. Mention numbers if you have them.",
    link: "https://example.com",
  },
];

export const skills = [
  { group: "Languages", items: ["JavaScript", "TypeScript", "Python", "GLSL"] },
  { group: "Frontend", items: ["React", "Next.js", "CSS / Motion", "WebGL"] },
  { group: "Backend", items: ["Node.js", "PostgreSQL", "REST / GraphQL"] },
  { group: "Tools", items: ["Figma", "Git", "Docker", "Vercel"] },
];

export const education = [
  {
    id: "edu-1",
    title: "B.Sc. Computer Science",
    institution: "University Name",
    period: "2016 — 2020",
    note: "Placeholder note — thesis, honours, focus area.",
  },
  {
    id: "edu-2",
    title: "Certification Name",
    institution: "Issuing Organisation",
    period: "2023",
    note: "Placeholder note about the certification.",
  },
];

export const contact = {
  email: "hello@example.com",
  phone: "+00 000 000 0000",
  location: "City, Country",
  availability: "Open to freelance & full-time roles",
  note: "Have a lead? Leave a message and I will get back to you within 48 hours.",
};

export const socials = [
  { id: "github", label: "GitHub", handle: "@username", url: "https://github.com/" },
  { id: "linkedin", label: "LinkedIn", handle: "in/username", url: "https://www.linkedin.com/" },
  { id: "instagram", label: "Instagram", handle: "@username", url: "https://www.instagram.com/" },
  { id: "x", label: "X / Twitter", handle: "@username", url: "https://x.com/" },
];
