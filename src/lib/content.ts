export const profile = {
  name: "Komal Kedarnath G",
  shortName: "Komal",
  /**
   * Name variants that appear across the site and the wider web. Published
   * in `alternateName` so search engines and language models resolve every
   * spelling to the same person rather than treating them as separate people.
   */
  alternateNames: ["Komal Kedarnath", "kodekave"],
  role: "Founder's Office Operator & GTM Strategist",
  tagline: "Helping founders build and scale — from idea to operations.",
  subTagline:
    "A founder's-office operator and GTM strategist who has scaled four ventures across four countries — India, the Maldives, the US, and the UK — turning early-stage vision into go-to-market execution, revenue, and operating systems that hold.",
  /** One-sentence entity description, used in structured data. */
  schemaDescription:
    "Founder's-office operator and GTM strategist with 6+ years building and scaling four early-stage ventures across India, the Maldives, the United States, and the United Kingdom — covering go-to-market execution, cross-border operations, financial operations, and fundraising support.",
  email: "kmailstation@gmail.com",
  linkedin: "https://www.linkedin.com/in/komalkedarnath",
  location: "India (open to relocation / remote)",
  /**
   * Verified profiles for schema `sameAs`. This is the strongest single
   * signal for entity consolidation, so add every profile you control.
   */
  sameAs: [
    "https://www.linkedin.com/in/komalkedarnath",
    "https://github.com/kodekave",
    "https://orcid.org/0000-0003-4980-5945",
  ],
  knowsAbout: [
    "Founder's Office Operations",
    "Go-to-Market Strategy",
    "Cross-Border Business Operations",
    "International Market Entry",
    "Startup Financial Operations",
    "Fundraising Support",
    "Program Management",
    "Startup Scaling",
  ],
  /** TODO(komal): paste the Travel Hands UK site URL to strengthen worksFor. */
  currentEmployerUrl: "",
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
  /**
   * Official site or LinkedIn company page. Linking these turns four
   * unverifiable claims into corroborated ones, which is the main E-E-A-T
   * lever on this site. Empty string renders as plain text, no broken link.
   * TODO(komal): paste URLs here.
   */
  url?: string;
  /**
   * Additional corroborating links for a venture that covers more than one
   * entity or has a public listing separate from its site.
   */
  links?: { label: string; url: string }[];
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
    url: "",
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
    url: "https://www.neuralzome.com/",
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
    url: "",
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
    url: "https://genex.space/",
    links: [
      {
        label: "SpaceCat on Tripadvisor",
        url: "https://www.tripadvisor.in/Attraction_Review-g298571-d26937142-Reviews-Space_Cat_Astrotourism-Male.html",
      },
    ],
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

export const education = {
  institution: "Visvesvaraya Technological University",
  url: "https://vtu.ac.in/",
};

export type EarlierRole = {
  company: string;
  period: string;
  description: string;
  /** Organisation site, where one exists. */
  url?: string;
  /** A citable output from the role — the strongest kind of proof. */
  reference?: { label: string; url: string };
};

export const earlierRoles: EarlierRole[] = [
  {
    company: "Independent Researcher — IIT Bombay (FOSSEE)",
    period: "Nov 2020 — Feb 2022",
    description:
      "Conducted independent computational fluid dynamics research, running OpenFOAM simulations in a sandboxed Linux environment on resource-constrained hardware — published through IIT Bombay's FOSSEE open-source initiative.",
    url: "https://fossee.in/",
    reference: {
      label: "Running OpenFOAM on Android — A Workflow Study (DOI)",
      url: "https://doi.org/10.5281/zenodo.6044898",
    },
  },
  {
    company: "PR/Publications Manager (R&D) — SSERD",
    period: "Dec 2019 — Nov 2020",
    description:
      "Managed PR and content strategy for space-education research publications at the Society for Space Education Research & Development, my first role working directly with founders on zero-to-one ideas.",
    url: "https://www.sserd.org/",
  },
  {
    company: "Mechanical Design Intern — Aria Aerotech",
    period: "Jul — Aug 2018",
    description:
      "One-month mechanical design internship at an early-stage Bangalore aerospace startup, working on design assignments the team could build on directly.",
  },
  {
    company: "Internship Trainee — Vestas Wind Technology India",
    period: "Jan 2018",
    description:
      "Service department internship at the Indian arm of Vestas, the Danish wind-energy manufacturer — my first exposure to operations inside a large multinational.",
    url: "https://www.vestas.com/en",
  },
];

/**
 * Recognition and research participation, kept separate from `distinctions`
 * (visas, test scores) because these are third-party verifiable and name
 * well-known institutions — which is exactly what search engines and
 * language models use to place a person in a field.
 *
 * Descriptions state precisely what each award was. Several of these are
 * participation or appreciation recognitions rather than competition wins,
 * and the NASA-linked ones are NASA-*supported* programmes, not NASA
 * endorsements — the IASC certificate carries that disclaimer explicitly.
 */
export const recognition: {
  title: string;
  org: string;
  period: string;
  detail: string;
  url?: string;
  linkLabel?: string;
}[] = [
  {
    title: "Winning team member, CERN Webfest 2021",
    org: "CERN openlab",
    period: "2021",
    detail:
      "CERN openlab's global open-web-technology hackathon, held in Geneva.",
    url: "https://webfest-online.web.cern.ch/",
    linkLabel: "CERN Webfest",
  },
  {
    title: "Running OpenFOAM on Android — CFD case study",
    org: "FOSSEE, IIT Bombay",
    period: "2021 — 2022",
    detail:
      "Completed and published a computational fluid dynamics case study through FOSSEE at IIT Bombay, a Ministry of Education (NMEICT) programme, demonstrating that OpenFOAM simulations could be run on an Android phone rather than lab hardware. Published with a DOI.",
    url: "https://cfd.fossee.in/case-study-project",
    linkLabel: "FOSSEE case study project",
  },
  {
    title: "Asteroid search campaign participant",
    org: "International Astronomical Search Collaboration, with SSERD",
    period: "Sep — Oct 2020",
    detail:
      "Analysed Pan-STARRS telescope imagery for near-Earth objects and Main Belt asteroids as part of an IASC campaign run with SSERD and Hands-On Universe India. The campaign is supported by NASA under cooperative agreement 80NSSC18K0855.",
    url: "https://iasc.cosmosearch.org/",
    linkLabel: "IASC",
  },
  {
    title: "Galactic Problem-Solver recognition",
    org: "NASA International Space Apps Challenge",
    period: "Oct 2020",
    detail:
      "Recognised in special appreciation for work addressing challenges on Earth and in space, at the 2020 edition of NASA's global hackathon.",
    url: "https://www.spaceappschallenge.org/",
    linkLabel: "NASA Space Apps Challenge",
  },
];

/**
 * Published research output. A DOI is a persistent identifier, which makes
 * this the most durable corroboration on the site — worth surfacing in
 * structured data as well as on the page.
 */
export const publication = {
  title: "Running OpenFOAM on Android — A Workflow Study",
  type: "Report",
  publisher: "Zenodo",
  datePublished: "2022-01-20",
  doi: "10.5281/zenodo.6044898",
  url: "https://doi.org/10.5281/zenodo.6044898",
  license: "https://creativecommons.org/licenses/by/4.0/",
  description:
    "A step-by-step workflow study of running OpenFOAM on Android, worked through with a simple elbow case.",
};

export const distinctions: {
  text: string;
  url?: string;
  /** Descriptive anchor text — "Reference" tells a crawler nothing. */
  linkLabel?: string;
}[] = [
  {
    text: "Valid US B1/B2 visa, with a multi-country travel and remote-work history across the US, Maldives, and India",
  },
  {
    text: "Multi-country work-visa experience in the Maldives, including cross-border compliance navigation",
  },
  { text: "TOEFL iBT: 105/120" },
  {
    text: "AFCAT cleared twice, advanced to the Services Selection Board (SSB) interview stage",
  },
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
