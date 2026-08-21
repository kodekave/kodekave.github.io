export const profile = {
  name: "Komal Kedarnath G",
  shortName: "Komal",
  role: "Founder's Office Operator & GTM Strategist",
  tagline: "Helping founders build and scale — from idea to operations.",
  subTagline:
    "A founder's-office operator and GTM strategist who has scaled four ventures across four countries — India, the Maldives, the US, and the UK — turning early-stage vision into go-to-market execution, revenue, and operating systems that hold.",
  email: "kmailstation@gmail.com",
  linkedin: "https://linkedin.com/in/komalkedarnath",
  location: "India (open to relocation / remote)",
};

export const stats = [
  { value: "6+", label: "Years as a founder's-office operator" },
  { value: "4", label: "Countries — India, Maldives, US, UK" },
  { value: "$2.1M+", label: "Raised by ventures I've operated for" },
  { value: "250%", label: "Revenue growth delivered" },
  { value: "17", label: "Cross-border team members led" },
  { value: "5,000+", label: "Students & guests reached" },
];

export type Venture = {
  slug: string;
  company: string;
  role: string;
  period: string;
  location: string;
  country: string;
  category: string;
  summary: string;
  highlights: string[];
  current?: boolean;
};

export const ventures: Venture[] = [
  {
    slug: "travel-hands-uk",
    company: "Travel Hands UK",
    role: "Founder's Office Associate",
    period: "Apr 2026 — Present",
    location: "Remote from India",
    country: "United Kingdom",
    category: "Accessibility Tech",
    summary:
      "A UK-based accessibility-technology company improving urban mobility for blind and low-vision commuters in London.",
    highlights: [
      "Drive business operations and strategic execution as the founder's direct operating partner, fully remote from India.",
      "Translate leadership priorities into structured execution plans across a distributed, cross-border team.",
      "Bring founder's-office, GTM, and program-management experience from AI/robotics and space-tech ventures into a social-impact technology company.",
    ],
    current: true,
  },
  {
    slug: "neuralzome-cybernetics",
    company: "Neuralzome Cybernetics",
    role: "Head of International Operations (Founder's Office)",
    period: "Feb 2025 — Feb 2026",
    location: "India & United States",
    country: "United States",
    category: "AI / Robotics",
    summary:
      "Led international operations for a 20-person, VC-backed AI/robotics startup that raised $2.1M — the primary link between the founder's office and global operations, managing a 6-person cross-border team.",
    highlights: [
      "Drove US market entry and customer acquisition end-to-end: entity setup, ODI compliance, US banking, vendor network, and logistics — closing the company's first US customers and initial revenue.",
      "Owned financial operations across a ~₹1 Cr monthly budget, building centralized cross-border billing and metrics dashboards for 100% accuracy in multi-currency monthly close.",
      "Led GTM execution and program management for 4+ product launches, turning CEO-stage concepts into operational frameworks.",
      "Translated corporate strategy into actionable OKRs, improving stakeholder engagement and team productivity by 25%.",
    ],
  },
  {
    slug: "uduvilla-investments",
    company: "Uduvilla Investments",
    role: "International Business and Ops (Founder's Office)",
    period: "Nov 2023 — Nov 2024",
    location: "Maldives",
    country: "Maldives",
    category: "Hospitality & Investments",
    summary:
      "Ran day-to-day operations for an international investment firm's multi-business portfolio, including hospitality — freeing the founder to focus on external relationships and expansion.",
    highlights: [
      "Coordinated a 17-employee multinational team across the founder's business portfolio.",
      "Built operational tracking, information architecture, and cross-border compliance processes from the ground up.",
      "Grew tourism and guest-experience revenue by 250% through redesigned service operations and high-ticket travel packages averaging $2,000 per booking.",
      "Designed automated reporting systems that cut leadership's manual data-retrieval time by 10+ hours a week.",
    ],
  },
  {
    slug: "genex-space-spacecat",
    company: "Genex Space & SpaceCat",
    role: "International Business and Ops (Founder's Office)",
    period: "Feb 2022 — Aug 2023",
    location: "Maldives & India",
    country: "Maldives",
    category: "Space-Tech",
    summary:
      "Built core business infrastructure and fundraising materials from inception for two international space-tech ventures, working directly alongside their founding teams.",
    highlights: [
      "Built investor proposals — data rooms, financial memos, and decks — that directly closed angel funding rounds alongside the founders.",
      "Delivered international astronomy and stargazing programs reaching 5,000+ students and guests, in partnership with Finland International School (Malé) and premium resort operators.",
      "Owned stakeholder and customer relations across a distributed founding team, operating with minimal oversight in a 0-to-1 environment.",
    ],
  },
];

export const earlierRoles = [
  {
    company: "Independent Researcher — IIT Bombay (FOSSEE)",
    period: "Nov 2020 — Feb 2022",
    description:
      "Conducted independent computational fluid dynamics research, running OpenFOAM simulations in a sandboxed Linux environment on resource-constrained hardware — published through IIT Bombay's FOSSEE open-source initiative.",
  },
  {
    company: "PR/Publications Manager (R&D) — SSERD",
    period: "Dec 2019 — Nov 2020",
    description:
      "Managed PR and content strategy for space-education research publications at the Society for Space Education Research & Development, my first role working directly with founders on zero-to-one ideas.",
  },
];

export const distinctions = [
  "Valid US B1/B2 visa, with a multi-country travel and remote-work history across the US, Maldives, and India",
  "Multi-country work-visa experience in the Maldives, including cross-border compliance navigation",
  "TOEFL iBT: 105/120",
  "AFCAT cleared twice, advanced to the Services Selection Board (SSB) interview stage",
  "Winning team member, CERN Webfest 2021 (CERN openlab's global open-web-technology hackathon), Geneva",
];

export const journey = [
  {
    heading: "Where I am now",
    body: "I now work remotely for Travel Hands UK, a London-based accessibility-tech company improving mobility for blind and low-vision commuters — still in the founder's office, still turning priorities into execution. Every one of these ventures shares a throughline: founders who needed someone they could hand an idea to and trust it would come back as a working business.",
  },
];

export const route = [
  { code: "IN", label: "India", years: "2019–22" },
  { code: "MV", label: "Maldives", years: "2022–24" },
  { code: "US", label: "United States", years: "2025–26" },
  { code: "UK", label: "United Kingdom", years: "2026–" },
];

const countryCodes: Record<string, string> = {
  India: "IN",
  Maldives: "MV",
  "United States": "US",
  "United Kingdom": "UK",
};

export function countryCode(country: string): string {
  return countryCodes[country] ?? country.slice(0, 2).toUpperCase();
}

export const sponsorTiers = [
  {
    name: "Newsletter Mention",
    price: "From $150 / issue",
    description:
      "A dedicated mention in one issue of the newsletter, reaching founders and operators interested in GTM, cross-border ops, and founder's-office work.",
  },
  {
    name: "Blog Sponsorship",
    price: "From $250 / post",
    description:
      "Feature your product or service alongside original writing on startup scaling, operations, and founder's-office work.",
  },
  {
    name: "Ongoing Partnership",
    price: "Custom",
    description:
      "For tools and services I actually use and would recommend to other founders and operators — a recurring placement across the newsletter and site.",
  },
];
