export interface Event {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  location_name: string | null;
  location_address: string | null;
  is_online: boolean;
  online_url: string | null;
  categories: string[];
  image_url: string | null;
  source_url: string | null;
  source_platform: string | null;
  source_id: string | null;
  organizer_name: string;
  organizer_title: string | null;
  organizer_company: string | null;
  organizer_avatar_url: string | null;
  status: "approved" | "pending" | "rejected";
  created_at: string;
  updated_at: string;
}

export interface Subscriber {
  id: string;
  email: string;
  created_at: string;
}

export type EventCategory =
  | "networking"
  | "product"
  | "startup"
  | "tech"
  | "career"
  | "community"
  | "education"
  | "other";

export const CATEGORIES: { value: EventCategory; label: string }[] = [
  { value: "networking", label: "Networking" },
  { value: "product", label: "Product" },
  { value: "startup", label: "Startup" },
  { value: "tech", label: "Tech" },
  { value: "career", label: "Career" },
  { value: "community", label: "Community" },
  { value: "education", label: "Education" },
  { value: "other", label: "Other" },
];
