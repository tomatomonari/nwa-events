import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const events = [
  {
    title: "Road to FX: What Investors Decide in the First 10 Minutes",
    description: "Nick Moran, General Partner at New Stack Ventures and host of The Full Ratchet podcast, shares insights from hearing thousands of pitches. Covers capturing investor attention through storytelling, communicating vision and market traction, and avoiding common presentation mistakes.",
    start_date: "2026-02-17T19:00:00.000Z",
    end_date: "2026-02-17T20:00:00.000Z",
    is_online: true,
    online_url: "https://lu.ma/mfy8elqi",
    categories: ["startup"],
    source_url: "https://lu.ma/mfy8elqi",
    source_platform: "luma",
    organizer_name: "Onward HQ Team",
    organizer_title: null,
    organizer_company: "Onward NWA",
    status: "approved",
  },
  {
    title: "Road to FX: Is Your Startup Venture-Backable?",
    description: "Haley Bryant, Partner at Hustle Fund, helps founders determine when to seek VC funding. Covers what 'venture-scale' means, readiness vs. opportunity, when VC might be counterproductive, and alternative funding approaches.",
    start_date: "2026-02-23T19:00:00.000Z",
    end_date: "2026-02-23T20:00:00.000Z",
    is_online: true,
    online_url: "https://lu.ma/c744axph",
    categories: ["startup"],
    source_url: "https://lu.ma/c744axph",
    source_platform: "luma",
    organizer_name: "Onward HQ Team",
    organizer_title: null,
    organizer_company: "Onward NWA",
    status: "approved",
  },
  {
    title: "GP / LP Mixer + VIP Salon Dinners",
    description: "Invite-only networking event. GP/LP mixer from 5-6 PM bringing together early-stage investors, established entrepreneurs, and corporate leaders. At 6:30 PM, intimate salon dinners with small-group conversations organized by theme and industry focus. Part of Onward FX 2026.",
    start_date: "2026-04-20T22:00:00.000Z",
    end_date: "2026-04-21T01:30:00.000Z",
    location_name: "Downtown Bentonville",
    location_address: "Bentonville, AR",
    is_online: false,
    categories: ["startup", "networking"],
    source_url: "https://lu.ma/yg18ynhb",
    source_platform: "luma",
    organizer_name: "Serafina Lalany",
    organizer_title: "Executive Director",
    organizer_company: "StartupNWA",
    status: "approved",
  },
  {
    title: "Unscripted: The Opening Session at Onward FX",
    description: "Fast-paced unconference with lightning panels and one powerful closing conversation. Challenges assumptions and shifts the venture conversation forward. Networking with 20+ visiting investors from nationwide.",
    start_date: "2026-04-21T15:30:00.000Z",
    end_date: "2026-04-21T18:00:00.000Z",
    location_name: "Ledger Bentonville",
    location_address: "240 S Main St, Bentonville, AR 72712",
    is_online: false,
    categories: ["startup", "networking"],
    source_url: "https://lu.ma/dvhu4ry5",
    source_platform: "luma",
    organizer_name: "Onward HQ Team",
    organizer_title: null,
    organizer_company: "Onward NWA",
    status: "approved",
  },
  {
    title: "Heartland Startup Community Happy Hour",
    description: "Closing event for Onward FX. Light bites, drinks, and networking at the Walmart Museum rooftop. A thank-you gathering for founders, investors, and the community.",
    start_date: "2026-04-21T22:00:00.000Z",
    end_date: "2026-04-22T00:00:00.000Z",
    location_name: "The Walmart Museum — Top of the Block Rooftop",
    location_address: "Bentonville, AR",
    is_online: false,
    categories: ["startup", "networking", "community"],
    source_url: "https://lu.ma/2set0vnl",
    source_platform: "luma",
    organizer_name: "Serafina Lalany",
    organizer_title: "Executive Director",
    organizer_company: "StartupNWA",
    status: "approved",
  },
];

async function seed() {
  console.log(`Inserting ${events.length} Luma events...`);
  const { data, error } = await supabase.from("events").insert(events).select();

  if (error) {
    console.error("Failed to seed:", error);
    return;
  }

  console.log(`Added ${data.length} Luma events!`);
}

seed().catch(console.error);
