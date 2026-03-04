export interface Song {
  id: string;
  title: string;
  artist: string;
  description: string;
  coverImage: string;
  tags: string[];
  price: number;
  previewUrl: string;
  isSold: boolean;
  duration: number; // seconds
}

export interface CustomRequest {
  id: string;
  occasion: string;
  names: string;
  brandName?: string;
  tone: string;
  language: string;
  description: string;
  budget: number;
  status: "pending" | "in_progress" | "completed";
  createdAt: string;
}

export const TAGS = [
  "Romantic",
  "Wedding",
  "Motivational",
  "Devotional",
  "Brand",
  "Birthday",
  "Anniversary",
  "Hype",
  "Emotional",
  "Corporate",
];

const covers = [
  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1504898770365-14faca6a7320?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1485579149621-3123dd979885?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=400&h=400&fit=crop",
];

export const mockSongs: Song[] = [
  {
    id: "1",
    title: "Eternal Promise",
    artist: "AI Song Vault",
    description: "A beautiful romantic ballad perfect for wedding ceremonies and anniversary celebrations. Features gentle piano melodies with orchestral accompaniment.",
    coverImage: covers[0],
    tags: ["Romantic", "Wedding"],
    price: 2999,
    previewUrl: "",
    isSold: false,
    duration: 240,
  },
  {
    id: "2",
    title: "Rise Above",
    artist: "AI Song Vault",
    description: "An uplifting motivational anthem that inspires action and determination. Perfect for corporate events and personal motivation.",
    coverImage: covers[1],
    tags: ["Motivational", "Corporate"],
    price: 3499,
    previewUrl: "",
    isSold: false,
    duration: 195,
  },
  {
    id: "3",
    title: "Sacred Light",
    artist: "AI Song Vault",
    description: "A serene devotional track with ethereal vocals and spiritual harmonies. Ideal for meditation and prayer sessions.",
    coverImage: covers[2],
    tags: ["Devotional", "Emotional"],
    price: 1999,
    previewUrl: "",
    isSold: false,
    duration: 300,
  },
  {
    id: "4",
    title: "Brand Anthem",
    artist: "AI Song Vault",
    description: "A catchy, modern brand jingle designed to make your brand memorable. High energy with contemporary production.",
    coverImage: covers[3],
    tags: ["Brand", "Hype"],
    price: 4999,
    previewUrl: "",
    isSold: false,
    duration: 180,
  },
  {
    id: "5",
    title: "Birthday Groove",
    artist: "AI Song Vault",
    description: "A fun, upbeat birthday celebration song that makes any party unforgettable. Customizable with names.",
    coverImage: covers[4],
    tags: ["Birthday", "Hype"],
    price: 1499,
    previewUrl: "",
    isSold: false,
    duration: 210,
  },
  {
    id: "6",
    title: "Forever Yours",
    artist: "AI Song Vault",
    description: "A tender anniversary song capturing the beauty of lasting love. Acoustic guitar with heartfelt lyrics.",
    coverImage: covers[5],
    tags: ["Anniversary", "Romantic", "Emotional"],
    price: 2499,
    previewUrl: "",
    isSold: false,
    duration: 270,
  },
  {
    id: "7",
    title: "Divine Grace",
    artist: "AI Song Vault",
    description: "A powerful devotional hymn blending traditional and contemporary elements. Perfect for spiritual gatherings.",
    coverImage: covers[6],
    tags: ["Devotional", "Wedding"],
    price: 2299,
    previewUrl: "",
    isSold: false,
    duration: 255,
  },
  {
    id: "8",
    title: "Unstoppable",
    artist: "AI Song Vault",
    description: "An energetic motivational track with driving beats and empowering lyrics. Great for workouts and presentations.",
    coverImage: covers[7],
    tags: ["Motivational", "Hype", "Corporate"],
    price: 3999,
    previewUrl: "",
    isSold: false,
    duration: 225,
  },
];

export const mockPurchasedSongs: Song[] = [
  {
    id: "p1",
    title: "My Love Song",
    artist: "AI Song Vault",
    description: "A personalized love song created just for you.",
    coverImage: covers[0],
    tags: ["Romantic"],
    price: 2999,
    previewUrl: "",
    isSold: true,
    duration: 240,
  },
];

export const mockCustomRequests: CustomRequest[] = [
  {
    id: "cr1",
    occasion: "Wedding",
    names: "John & Sarah",
    tone: "Romantic",
    language: "English",
    description: "A beautiful wedding song for our ceremony",
    budget: 5000,
    status: "in_progress",
    createdAt: "2026-02-28",
  },
];
