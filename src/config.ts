// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export interface SocialLink {
    href: string;
    label: string;
}

interface Site {
    website: string;
    author: string;
    authorUsername: string;
    authorUrl: string;
    githubUrl: string;
    desc: string;
    title: string;
    lightAndDarkMode: boolean;
    lang: string;
}

const url = import.meta.env.PUBLIC_VITE_BASE_URL;

// Site configuration
export const SITE: Site = {
    website: url,
    author: "Sriram Seelamneni",
    authorUsername: "sriramsme",
    authorUrl: "https://srirams.me",
    githubUrl: "https://github.com/sriramsme/TimeCapsule",

    title: "TimeCapsule — Your life in yearly snapshots",
    desc:
        "A tool to create year-by-year life timelines with memories, milestones, and future aspirations. Share. Embed.",
    lightAndDarkMode: true,
    lang: "en"
};