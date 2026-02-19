// Run: npx tsx scripts/seed.ts
// Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper to create dates relative to today
function daysFromNow(days: number, hour: number = 18, minute: number = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

const events = [
  {
    title: "NWA Product Managers Meetup",
    description:
      "Monthly meetup for product managers in Northwest Arkansas. This month we're discussing roadmap prioritization frameworks and hearing from a PM lead at Walmart about how they manage product at scale. Networking and drinks provided.",
    start_date: daysFromNow(0, 18, 0),
    end_date: daysFromNow(0, 20, 0),
    location_name: "Record",
    location_address: "119 W Central Ave, Bentonville, AR 72712",
    is_online: false,
    categories: ["product", "networking"],
    source_url: "https://lu.ma/nwa-pm-meetup",
    source_platform: "luma",
    organizer_name: "Sarah Chen",
    organizer_title: "Senior PM",
    organizer_company: "Walmart",
    status: "approved",
  },
  {
    title: "Startup Grind NWA: Building in the Heartland",
    description:
      "Join us for an evening with founders building venture-backed companies in Northwest Arkansas. Hear their stories, lessons learned, and what makes NWA a unique place to build. Panel discussion followed by networking.",
    start_date: daysFromNow(1, 17, 30),
    end_date: daysFromNow(1, 20, 0),
    location_name: "Brewer Family Entrepreneurship Hub",
    location_address: "700 W Research Center Blvd, Fayetteville, AR 72701",
    is_online: false,
    categories: ["startup", "networking"],
    source_url: "https://lu.ma/startup-grind-nwa",
    source_platform: "luma",
    organizer_name: "Mike Rodriguez",
    organizer_title: "Community Lead",
    organizer_company: "Startup Grind NWA",
    status: "approved",
  },
  {
    title: "NWA Tech Meetup — AI/ML in Practice",
    description:
      "Hands-on session exploring how NWA companies are using AI and machine learning in production. Three lightning talks from local engineers followed by a workshop building a simple RAG pipeline.",
    start_date: daysFromNow(2, 18, 30),
    end_date: daysFromNow(2, 21, 0),
    location_name: "Kanbar Center for Innovation",
    location_address: "201 NE A St, Bentonville, AR 72712",
    is_online: false,
    categories: ["tech", "education"],
    source_url: "https://meetup.com/nwa-tech/ai-ml",
    source_platform: "manual",
    organizer_name: "James Park",
    organizer_title: "ML Engineer",
    organizer_company: "Oseberg",
    status: "approved",
  },
  {
    title: "Women in Tech NWA Coffee Chat",
    description:
      "Casual coffee and conversation for women working in tech across Northwest Arkansas. All experience levels welcome. A relaxed space to connect, share experiences, and build community.",
    start_date: daysFromNow(3, 8, 0),
    end_date: daysFromNow(3, 9, 30),
    location_name: "Onyx Coffee Lab",
    location_address: "100 NW 2nd St, Bentonville, AR 72712",
    is_online: false,
    categories: ["networking", "tech", "community"],
    source_platform: "manual",
    organizer_name: "Priya Patel",
    organizer_title: "Engineering Manager",
    organizer_company: "Walmart Global Tech",
    status: "approved",
  },
  {
    title: "NWA Career Fair — Tech & Innovation",
    description:
      "Annual career fair connecting NWA talent with top employers. Companies attending include Walmart Global Tech, J.B. Hunt, Tyson Foods, and several high-growth startups. Bring your resume and be ready to network.",
    start_date: daysFromNow(4, 10, 0),
    end_date: daysFromNow(4, 16, 0),
    location_name: "John Q. Hammons Center",
    location_address: "3303 S Pinnacle Hills Pkwy, Rogers, AR 72758",
    is_online: false,
    categories: ["career", "networking"],
    source_url: "https://eventbrite.com/e/nwa-career-fair",
    source_platform: "eventbrite",
    organizer_name: "NWA Council",
    organizer_title: null,
    organizer_company: "NWA Council",
    status: "approved",
  },
  {
    title: "Bentonville Design Week — Opening Night",
    description:
      "Kick off Design Week in downtown Bentonville. Gallery walk featuring work from local designers, interactive installations, and a keynote from a design leader at Walmart. Refreshments and music.",
    start_date: daysFromNow(5, 19, 0),
    end_date: daysFromNow(5, 22, 0),
    location_name: "The Momentary",
    location_address: "507 SE E St, Bentonville, AR 72712",
    is_online: false,
    categories: ["community", "tech"],
    source_platform: "manual",
    organizer_name: "Anika Torres",
    organizer_title: "Design Director",
    organizer_company: "Walmart",
    status: "approved",
  },
  {
    title: "Remote Work & Digital Nomads NWA",
    description:
      "Co-working session and discussion for remote workers in NWA. This week's topic: balancing async communication with deep work. Bring your laptop, grab coffee, and work alongside other remote professionals.",
    start_date: daysFromNow(0, 14, 0),
    end_date: daysFromNow(0, 17, 0),
    location_name: "Pressroom",
    location_address: "121 W Central Ave, Bentonville, AR 72712",
    is_online: false,
    categories: ["community", "networking"],
    source_platform: "manual",
    organizer_name: "David Kim",
    organizer_title: "Freelance Developer",
    organizer_company: null,
    status: "approved",
  },
  {
    title: "Intro to Product-Led Growth — Online Workshop",
    description:
      "Virtual workshop on PLG strategies for B2B SaaS. Learn how to design your product for self-serve adoption, measure activation, and build growth loops. Interactive exercises included.",
    start_date: daysFromNow(6, 12, 0),
    end_date: daysFromNow(6, 14, 0),
    is_online: true,
    online_url: "https://zoom.us/j/example",
    categories: ["product", "education"],
    source_url: "https://lu.ma/plg-workshop",
    source_platform: "luma",
    organizer_name: "Rachel Green",
    organizer_title: "Head of Growth",
    organizer_company: "Movista",
    status: "approved",
  },
  {
    title: "NWA Founders Dinner",
    description:
      "Intimate dinner for startup founders in NWA. Limited to 20 seats. Share what you're working on, get feedback, and connect with fellow builders. Dinner is covered — just bring yourself and your ideas.",
    start_date: daysFromNow(7, 19, 0),
    end_date: daysFromNow(7, 21, 30),
    location_name: "Pressroom",
    location_address: "121 W Central Ave, Bentonville, AR 72712",
    is_online: false,
    categories: ["startup", "networking"],
    source_platform: "manual",
    organizer_name: "Alex Thompson",
    organizer_title: "CEO",
    organizer_company: "RevUnit",
    status: "approved",
  },
  {
    title: "UofA Hackathon — Spring 2026",
    description:
      "24-hour hackathon at the University of Arkansas. Open to all students and recent grads. $5,000 in prizes. Themes: sustainability, health tech, and local community. Meals and swag provided.",
    start_date: daysFromNow(10, 9, 0),
    end_date: daysFromNow(11, 9, 0),
    location_name: "University of Arkansas — Bell Engineering Center",
    location_address: "850 W Dickson St, Fayetteville, AR 72701",
    is_online: false,
    categories: ["tech", "education", "community"],
    source_url: "https://hackathon.uark.edu",
    source_platform: "manual",
    organizer_name: "UofA CS Department",
    organizer_title: null,
    organizer_company: "University of Arkansas",
    status: "approved",
  },
  {
    title: "Supply Chain Innovation Meetup",
    description:
      "Monthly gathering of supply chain professionals in NWA. This session: how AI is transforming demand forecasting. Speakers from Walmart, J.B. Hunt, and ArcBest share real implementations.",
    start_date: daysFromNow(3, 17, 0),
    end_date: daysFromNow(3, 19, 0),
    location_name: "SupplyPike HQ",
    location_address: "658 E Millsap Rd, Fayetteville, AR 72703",
    is_online: false,
    categories: ["tech", "networking"],
    source_platform: "manual",
    organizer_name: "Tom Martinez",
    organizer_title: "VP Engineering",
    organizer_company: "SupplyPike",
    status: "approved",
  },
  {
    title: "NWA JavaScript User Group",
    description:
      "Monthly JS meetup. This month: server components in Next.js 15, building type-safe APIs with tRPC, and a beginner-friendly intro to TypeScript generics. Pizza provided.",
    start_date: daysFromNow(5, 18, 0),
    end_date: daysFromNow(5, 20, 0),
    location_name: "Teslar Software",
    location_address: "220 N East Ave, Fayetteville, AR 72701",
    is_online: false,
    categories: ["tech", "community"],
    source_url: "https://meetup.com/nwa-js",
    source_platform: "manual",
    organizer_name: "Chris Nguyen",
    organizer_title: "Senior Frontend Engineer",
    organizer_company: "Teslar Software",
    status: "approved",
  },
];

async function seed() {
  console.log("Seeding events...");

  // Clear existing seed data
  const { error: deleteError } = await supabase
    .from("events")
    .delete()
    .in("source_platform", ["manual", "luma", "eventbrite"]);

  if (deleteError) {
    console.error("Failed to clear existing events:", deleteError);
    return;
  }

  const { data, error } = await supabase.from("events").insert(events).select();

  if (error) {
    console.error("Failed to seed events:", error);
    return;
  }

  console.log(`Seeded ${data.length} events successfully!`);
}

seed().catch(console.error);
