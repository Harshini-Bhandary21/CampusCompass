export interface Club {
  id: string;
  name: string;
  fullName: string;
  slug: string;
  category: "technical" | "recreational" | "cultural";
  icon: string;
  established: string;
  shortDescription: string;
  description: string;
  image: string;
  facultyAdvisor: {
    name: string;
    email: string;
    department: string;
  };
  president: {
    name: string;
    email: string;
    phone: string;
  };
  achievements: string[];
  eventsParticipated: string[];
  eventsOrganized: string[];
  salientFeatures: string[];
  memberCount: number;
}

export interface Event {
  id: string;
  title: string;
  club: string;
  clubName: string;
  date: string;
  description: string;
  category: "technical" | "recreational" | "cultural";
  image: string;
  status: "upcoming" | "past";
}

export interface Achievement {
  id: string;
  year: string;
  title: string;
  student: string;
  club: string;
  description: string;
  category: "technical" | "cultural" | "recreational";
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  club: string;
  clubName: string;
  email: string;
  department: string;
  type: "faculty" | "student";
  image: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  club: string;
  category: string;
  image: string;
}

export interface ContactInfo {
  institution: string;
  shortName: string;
  email: string;
  phones: string[];
  address: string;
  website: string;
  social: {
    facebook: string;
    twitter: string;
    instagram: string;
    linkedin: string;
    youtube: string;
  };
  clubsOverview: {
    description: string;
    extendedDescription: string;
    goal: string;
  };
  stats: {
    totalClubs: number;
    technicalClubs: number;
    recreationalClubs: number;
    culturalClubs: number;
    totalMembers: number;
    eventsPerYear: number;
    awardsWon: number;
  };
}
