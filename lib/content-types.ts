import { z } from 'zod';

// Base interfaces for content structure
export interface ButtonConfig {
  label: string;
  link?: string | null;
  variant?: 'primary' | 'secondary' | 'outline';
}

export interface NavigationItem {
  id?: number;
  label: string;
  link?: string | null;
  children?: NavigationItem[];
}

export interface ContentSection {
  heading: string;
  text: string;
  button?: ButtonConfig;
  image?: string | null;
}

export interface HighlightCard {
  title: string;
  description: string;
  image?: string | null;
}

export interface AchievementCard {
  title: string;
  description: string;
  image?: string | null;
}

export interface BlogPost {
  title: string;
  link?: string | null;
  image?: string | null;
}

export interface TeamMember {
  name: string;
  role: string;
  profile_image?: string | null;
}

export interface QuickLink {
  label: string;
  link?: string | null;
}

export interface ContactInfo {
  head_office?: string;
  phone?: string[];
  phone_numbers?: string[];
  email: string;
}

export interface SocialLinks {
  facebook?: string;
  youtube?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
}

export interface Organization {
  name: string;
  email: string;
  head_office_address?: string;
  phone_numbers?: string[];
  copyright_year?: number;
  social_links?: SocialLinks;
  logo_image?: string | null;
  header_image?: string | null;
}

export interface HeroSection {
  title: string;
  subtitle: string;
  motto?: Record<string, string>;
  buttons: ButtonConfig[];
  image?: string | null;
}

export interface AchievementsSection {
  heading: string;
  text: string;
  cards: AchievementCard[];
}

export interface BlogSection {
  heading: string;
  description?: string;
  posts: BlogPost[];
}

export interface TeamSection {
  heading: string;
  members: TeamMember[];
}

export interface MissionVision {
  title: string;
  points?: string[];
  description?: string;
}

export interface AboutPageContent {
  page: string;
  organization: Organization;
  navigation: NavigationItem[];
  content: {
    heading: string;
    description: string;
    details?: string;
  };
  mission?: MissionVision;
  vision?: MissionVision;
  footer: {
    quick_links: QuickLink[];
    contact: ContactInfo;
    copyright: string;
  };
}

export interface FooterConfig {
  quick_links: QuickLink[];
  contact: ContactInfo;
  copyright: string;
}

export interface InfoJSON {
  organization: Organization;
  navigation: NavigationItem[];
  hero_section: HeroSection;
  highlight_cards: HighlightCard[];
  mission_section: ContentSection;
  call_to_action: ContentSection;
  achievements_section: AchievementsSection;
  about_section: ContentSection;
  blog_section: BlogSection;
  team_section: TeamSection;
  footer: FooterConfig;
  about_page?: AboutPageContent;
}

// Zod validation schemas
export const ButtonConfigSchema = z.object({
  label: z.string(),
  link: z.string().nullable().optional(),
  variant: z.enum(['primary', 'secondary', 'outline']).optional(),
});

export const NavigationItemSchema: z.ZodType<NavigationItem> = z.lazy(() =>
  z.object({
    id: z.number().optional(),
    label: z.string(),
    link: z.string().nullable().optional(),
    children: z.array(NavigationItemSchema).optional(),
  })
);

export const ContentSectionSchema = z.object({
  heading: z.string(),
  text: z.string(),
  button: ButtonConfigSchema.optional(),
  image: z.string().nullable().optional(),
});

export const HighlightCardSchema = z.object({
  title: z.string(),
  description: z.string(),
  image: z.string().nullable().optional(),
});

export const AchievementCardSchema = z.object({
  title: z.string(),
  description: z.string(),
  image: z.string().nullable().optional(),
});

export const BlogPostSchema = z.object({
  title: z.string(),
  link: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
});

export const TeamMemberSchema = z.object({
  name: z.string(),
  role: z.string(),
  profile_image: z.string().nullable().optional(),
});

export const QuickLinkSchema = z.object({
  label: z.string(),
  link: z.string().nullable().optional(),
});

export const ContactInfoSchema = z.object({
  head_office: z.string().optional(),
  phone: z.array(z.string()).optional(),
  phone_numbers: z.array(z.string()).optional(),
  email: z.string().email(),
});

export const SocialLinksSchema = z.object({
  facebook: z.string().optional(),
  youtube: z.string().optional(),
  instagram: z.string().optional(),
  twitter: z.string().optional(),
  linkedin: z.string().optional(),
});

export const OrganizationSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  head_office_address: z.string().optional(),
  phone_numbers: z.array(z.string()).optional(),
  copyright_year: z.number().optional(),
  social_links: SocialLinksSchema.optional(),
  logo_image: z.string().nullable().optional(),
  header_image: z.string().nullable().optional(),
});

export const HeroSectionSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  motto: z.record(z.string(), z.string()).optional(),
  buttons: z.array(ButtonConfigSchema),
  image: z.string().nullable().optional(),
});

export const AchievementsSectionSchema = z.object({
  heading: z.string(),
  text: z.string(),
  cards: z.array(AchievementCardSchema),
});

export const BlogSectionSchema = z.object({
  heading: z.string(),
  description: z.string().optional(),
  posts: z.array(BlogPostSchema),
});

export const TeamSectionSchema = z.object({
  heading: z.string(),
  members: z.array(TeamMemberSchema),
});

export const MissionVisionSchema = z.object({
  title: z.string(),
  points: z.array(z.string()).optional(),
  description: z.string().optional(),
});

export const AboutPageContentSchema = z.object({
  page: z.string(),
  organization: OrganizationSchema,
  navigation: z.array(NavigationItemSchema),
  content: z.object({
    heading: z.string(),
    description: z.string(),
    details: z.string().optional(),
  }),
  mission: MissionVisionSchema.optional(),
  vision: MissionVisionSchema.optional(),
  footer: z.object({
    quick_links: z.array(QuickLinkSchema),
    contact: ContactInfoSchema,
    copyright: z.string(),
  }),
});

export const FooterConfigSchema = z.object({
  quick_links: z.array(QuickLinkSchema),
  contact: ContactInfoSchema,
  copyright: z.string(),
});

export const InfoJSONSchema = z.object({
  organization: OrganizationSchema,
  navigation: z.array(NavigationItemSchema),
  hero_section: HeroSectionSchema,
  highlight_cards: z.array(HighlightCardSchema),
  mission_section: ContentSectionSchema,
  call_to_action: ContentSectionSchema,
  achievements_section: AchievementsSectionSchema,
  about_section: ContentSectionSchema,
  blog_section: BlogSectionSchema,
  team_section: TeamSectionSchema,
  footer: FooterConfigSchema,
  about_page: AboutPageContentSchema.optional(),
});

// Fallback content structure for error handling
export const getFallbackContent = (): InfoJSON => ({
  organization: {
    name: "ARPU Future Rise Life Foundation",
    email: "arpufrlfoundation@gmail.com",
    head_office_address: "B-17 3/F, FLAT 8, MANDWALI, FAZALPUR EAST DELHI",
    phone_numbers: ["+91 9919003332"],
    copyright_year: new Date().getFullYear(),
  },
  navigation: [
    { id: 0, label: "HOME", link: "/" },
    { id: 1, label: "ABOUT", link: "/about" },
    { id: 2, label: "PROGRAMS", link: "/programs" },
    { id: 3, label: "DONATE", link: "/donate" },
    { id: 4, label: "CONTACT", link: "/contact" },
  ],
  hero_section: {
    title: "Welcome to ARPU Future Rise Life Foundation",
    subtitle: "A Charity Unit",
    motto: {
      A: "Awareness",
      R: "Relief",
      P: "Progress",
      U: "Upliftment"
    },
    buttons: [
      { label: "Join Us", link: "/register" },
      { label: "Donate", link: "/donate" }
    ],
  },
  highlight_cards: [
    {
      title: "Children's Care",
      description: "Supporting children's health, education, and well-being through comprehensive care programs."
    },
    {
      title: "Community Development",
      description: "Building stronger communities through infrastructure, training, and empowerment initiatives."
    },
    {
      title: "Education & Empowerment",
      description: "Providing educational opportunities and skill development for sustainable growth."
    }
  ],
  mission_section: {
    heading: "Our Mission",
    text: "To empower marginalized communities and create sustainable positive change through education, healthcare, and community development programs.",
    button: { label: "Learn More", link: "/about" }
  },
  call_to_action: {
    heading: "Make a Difference Today",
    text: "Join us in our mission to create positive change in communities across India. Your support can transform lives.",
    button: { label: "Donate Now", link: "/donate" }
  },
  achievements_section: {
    heading: "Our Achievements",
    text: "Through dedicated efforts and community support, we have made significant impact across various sectors.",
    cards: [
      {
        title: "Child & Women Welfare",
        description: "Programs for safety, health, and growth initiated for women and children."
      },
      {
        title: "Community Development",
        description: "Infrastructure and training efforts for underdeveloped regions."
      },
      {
        title: "Education & Empowerment",
        description: "Educational workshops and skill development programs."
      }
    ]
  },
  about_section: {
    heading: "About Us",
    text: "ARPU Future Rise Life Foundation is committed to creating inclusive growth and empowering marginalized communities across India."
  },
  blog_section: {
    heading: "Latest Updates",
    description: "Stay informed about our latest initiatives and community impact stories.",
    posts: [
      { title: "Community Development Initiative", link: null },
      { title: "Education Program Launch", link: null },
      { title: "Healthcare Outreach Success", link: null }
    ]
  },
  team_section: {
    heading: "Our Team",
    members: [
      { name: "Team Member", role: "Coordinator" }
    ]
  },
  footer: {
    quick_links: [
      { label: "Home", link: "/" },
      { label: "About", link: "/about" },
      { label: "Programs", link: "/programs" },
      { label: "Contact", link: "/contact" }
    ],
    contact: {
      head_office: "B-17 3/F, FLAT 8, MANDWALI, FAZALPUR EAST DELHI",
      phone_numbers: ["+91 9919003332"],
      email: "arpufrlfoundation@gmail.com"
    },
    copyright: `© ${new Date().getFullYear()} ARPU Future Rise Life Foundation. All rights reserved.`
  }
});