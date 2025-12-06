
export enum QuestType {
  MAIN = 'MAIN',
  DAILY = 'DAILY',
  SIDE = 'SIDE',
  URGENT = 'URGENT'
}

export type BattleClass = 'ASSASSIN' | 'TANK' | 'MAGE' | 'RANGER';

export interface Quest {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  type: QuestType;
  completed: boolean;
  quality?: 'Excellent' | 'Good' | 'Poor';
}

export interface Stats {
  strength: number;
  agility: number;
  constitution: number;
  intellect: number;
}

export interface IntakeData {
  // Class
  battleClass: BattleClass;
  // Biometrics
  age: string;
  weight: string;
  height: string;
  gender: string;
  // Health
  injuries: string;
  chronicConditions: string;
  medications: string;
  // Lifestyle
  sleepQuality: string; // 1-10
  stressLevel: string; // 1-10
  occupation: string; // Sedentary/Active
  timeAvailable: string; // Mins per day
  daysAvailable: string; // Days per week
  // Goals
  primaryGoal: string; // Hypertrophy, Fat Loss, Strength
  experienceLevel: string; // Beginner, Intermediate, Advanced
  // Nutrition
  dietType: string;
  mealsPerDay: string;
  waterIntake: string;
  // Habits & Preferences
  alcohol?: string;
  smoker?: string;
  allergies?: string;
  gymAccess: string;
  cardioPreference?: string;
  motivation?: string;
  // 1st Phorm Specific
  optInSupplements: boolean;
  currentSupplements: string;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  notes: string;
}

export interface WorkoutSession {
  dayName: string; // e.g., "Monday - Chest/Triceps"
  focus: string;
  exercises: Exercise[];
  isRestDay: boolean;
}

export interface TrainingProgram {
  name: string; // e.g., "Shadow Monarch Hypertrophy"
  description: string;
  schedule: WorkoutSession[]; // Array of 7 days
}

export interface PlayerProfile {
  id: string;
  name: string;
  email: string;
  level: number;
  currentXp: number;
  xpToNextLevel: number;
  stats: Stats;
  projectedStats?: Stats; // Where they could be in 1 year
  title: string;
  status: 'PENDING' | 'AWAKENED' | 'VILLAIN' | 'LOCKED';
  streak: number;
  fatigueDebuff: boolean;
  intakeData?: IntakeData;
  trainingProgram?: TrainingProgram; // The personalized plan
  // Subscription / Gatekeeping
  trialStartDate: number;
  subscriptionActive: boolean; // True if opted in to 1st Phorm or Paid
  inventory?: InventoryItem[]; // Personalized Loadout
}

export interface DailyStatus {
  date: string;
  energy: number; // 1-10
  pain: number; // 1-10
  completed: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  type: 'CONSUMABLE' | 'EQUIPMENT';
  effect: string;
  link: string; // Affiliate link
  icon: string;
  reason?: string; // AI generated explanation
}
