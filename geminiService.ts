
import { GoogleGenAI, Type } from "@google/genai";
import { Quest, QuestType, PlayerProfile, IntakeData, Stats, TrainingProgram, InventoryItem } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });
const COACH_AFFILIATE_LINK = "https://1stphorm.com/DrewOnMisson";

// --- Catalog Data ---
const PRODUCT_CATALOG: InventoryItem[] = [
  { id: 'p1', name: 'Phormula-1', type: 'CONSUMABLE', effect: 'Rapid Assimilation Protein', link: COACH_AFFILIATE_LINK, icon: '🥤' },
  { id: 'p2', name: 'Ignition', type: 'CONSUMABLE', effect: 'Glycogen Replenishment', link: COACH_AFFILIATE_LINK, icon: '⚡' },
  { id: 'p3', name: 'Micro-Factor', type: 'CONSUMABLE', effect: 'Daily Nutrient Driver', link: COACH_AFFILIATE_LINK, icon: '💊' },
  { id: 'p4', name: 'Mega-Watt', type: 'CONSUMABLE', effect: 'Neuro-Stimulant (Pre-Workout)', link: COACH_AFFILIATE_LINK, icon: '🧪' },
  { id: 'p5', name: 'Level-1', type: 'CONSUMABLE', effect: 'Sustained Assimilation Protein', link: COACH_AFFILIATE_LINK, icon: '🍫' },
  { id: 'p6', name: 'Opti-Greens 50', type: 'CONSUMABLE', effect: 'Gut Health & Detox', link: COACH_AFFILIATE_LINK, icon: '🥬' },
  { id: 'p7', name: 'Creatine Monohydrate', type: 'CONSUMABLE', effect: 'ATP Regeneration', link: COACH_AFFILIATE_LINK, icon: '💪' },
  { id: 'p8', name: 'Full-Mega', type: 'CONSUMABLE', effect: 'Essential Fatty Acids', link: COACH_AFFILIATE_LINK, icon: '🐟' },
  { id: 'p9', name: 'Joint Mobility', type: 'CONSUMABLE', effect: 'Structural Repair', link: COACH_AFFILIATE_LINK, icon: '🦴' },
  { id: 'p10', name: 'Royal XXI King', type: 'CONSUMABLE', effect: 'Metabolic Thermogenic (Male)', link: COACH_AFFILIATE_LINK, icon: '🔥' },
  { id: 'p11', name: 'Royal XXI Queen', type: 'CONSUMABLE', effect: 'Metabolic Thermogenic (Female)', link: COACH_AFFILIATE_LINK, icon: '👑' },
  { id: 'p12', name: 'Night-T', type: 'CONSUMABLE', effect: 'Sleep Optimization', link: COACH_AFFILIATE_LINK, icon: '💤' },
];

// --- Mock Data Generators ---
const getMockQuests = (energy: number, pain: number): Quest[] => {
  const isRecovery = pain >= 7 || energy <= 3;
  if (isRecovery) {
    return [
      { id: 'mq-1', title: 'Emergency Recovery Protocol', description: '20 Min Full Body Yoga & Foam Rolling', xpReward: 35, type: QuestType.MAIN, completed: false },
      { id: 'dq-1', title: 'Elixir of Life', description: 'Drink 4L Water to flush toxins', xpReward: 15, type: QuestType.DAILY, completed: false },
      { id: 'sq-1', title: 'Mental Reboot', description: '15 Min Non-Sleep Deep Rest (NSDR)', xpReward: 20, type: QuestType.SIDE, completed: false },
    ];
  }
  return [
    { id: 'mq-1', title: 'Titan Strength Routine', description: 'Bench Press: 5x5 @ 80%, Incline DB: 3x10, Dips: 3xFailure', xpReward: 60, type: QuestType.MAIN, completed: false },
    { id: 'dq-1', title: 'Protein Synthesis', description: 'Consume 1g protein per lb of bodyweight', xpReward: 20, type: QuestType.DAILY, completed: false },
    { id: 'sq-1', title: 'Tactical Analysis', description: 'Review workout logs and plan next session', xpReward: 25, type: QuestType.SIDE, completed: false },
  ];
};

const getMockTrainingProgram = (): TrainingProgram => ({
  name: "System Default Protocol",
  description: "A balanced routine for general physical preparedness.",
  schedule: [
    { dayName: "Day 1", focus: "Push", isRestDay: false, exercises: [{ name: "Pushups", sets: 3, reps: "10-15", notes: "Focus on form" }] },
    { dayName: "Day 2", focus: "Pull", isRestDay: false, exercises: [{ name: "Pullups", sets: 3, reps: "AMRAP", notes: "Use band if needed" }] },
    { dayName: "Day 3", focus: "Legs", isRestDay: false, exercises: [{ name: "Squats", sets: 4, reps: "12", notes: "Depth is key" }] },
    { dayName: "Day 4", focus: "Rest", isRestDay: true, exercises: [] },
    { dayName: "Day 5", focus: "Full Body", isRestDay: false, exercises: [{ name: "Burpees", sets: 3, reps: "15", notes: "High intensity" }] },
    { dayName: "Day 6", focus: "Active Recovery", isRestDay: false, exercises: [{ name: "Walk", sets: 1, reps: "30 min", notes: "Low stress" }] },
    { dayName: "Day 7", focus: "Rest", isRestDay: true, exercises: [] },
  ]
});

// --- API Calls ---

export const generateOnboardingPlan = async (intake: IntakeData): Promise<{ projectedStats: Stats, initialTitle: string, trainingProgram: TrainingProgram }> => {
  if (!apiKey) return { 
    projectedStats: {strength: 15, agility: 15, constitution: 15, intellect: 15}, 
    initialTitle: "The Awakened",
    trainingProgram: getMockTrainingProgram() 
  };

  const model = "gemini-2.5-flash";
  const prompt = `
    Act as an elite strength and conditioning coach designed as an RPG System AI.
    Create a personalized 7-day Weekly Training Split for this user.
    
    INTAKE DATA:
    - BATTLE CLASS: ${intake.battleClass} (Base the entire program style on this class)
    - Goal: ${intake.primaryGoal}
    - Experience: ${intake.experienceLevel}
    - Injuries: ${intake.injuries} (CRITICAL: AVOID AGGRAVATING THESE)
    - Equipment: ${intake.gymAccess}
    - Days Available: ${intake.daysAvailable}
    - Time per day: ${intake.timeAvailable} mins

    CLASS STYLES:
    - ASSASSIN: High intensity, Calisthenics, Plyometrics, Agility.
    - TANK: Powerlifting, Heavy Compounds, Low reps, High rest.
    - MAGE: Scientific, Tempo training, Mobility, Pre-hab, Precision Hypertrophy.
    - RANGER: Endurance, Hybrid training, Functional circuits, Cardio.

    Directives:
    1. Base stats are currently 5. Project stats 1 year from now.
    2. Give them a cool RPG Title based on their Class (e.g., "Shadow Lord" for Assassin).
    3. Construct a "schedule" array of 7 days.
    4. For exercises, be specific (Sets, Reps, Notes).

    Return JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            projectedStats: {
              type: Type.OBJECT,
              properties: {
                strength: { type: Type.INTEGER },
                agility: { type: Type.INTEGER },
                constitution: { type: Type.INTEGER },
                intellect: { type: Type.INTEGER },
              }
            },
            initialTitle: { type: Type.STRING },
            trainingProgram: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                schedule: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      dayName: { type: Type.STRING },
                      focus: { type: Type.STRING },
                      isRestDay: { type: Type.BOOLEAN },
                      exercises: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            name: { type: Type.STRING },
                            sets: { type: Type.INTEGER },
                            reps: { type: Type.STRING },
                            notes: { type: Type.STRING }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });
    return JSON.parse(response.text);
  } catch (e) {
    console.error(e);
    return { 
        projectedStats: {strength: 15, agility: 15, constitution: 15, intellect: 15}, 
        initialTitle: "The Awakened",
        trainingProgram: getMockTrainingProgram() 
    };
  }
};

export const generateDailyQuests = async (
  energy: number,
  pain: number,
  playerProfile: PlayerProfile,
  recentHistory: Quest[] = []
): Promise<Quest[]> => {
  
  if (!apiKey) return getMockQuests(energy, pain);

  const model = "gemini-2.5-flash";
  
  const programContext = playerProfile.trainingProgram 
    ? `Follow the user's assigned program: "${playerProfile.trainingProgram.name}". Today is a random day in their schedule.`
    : "No set program, generate a generic workout.";

  const classContext = playerProfile.intakeData?.battleClass 
    ? `PLAYER CLASS: ${playerProfile.intakeData.battleClass}. Adjust terminology and quest style to fit this class archetype.`
    : "";

  const supplementContext = playerProfile.intakeData?.optInSupplements 
    ? "User is OPTED-IN to 1st Phorm. Include a DAILY QUEST to consume a specific 1st Phorm product (Phormula-1 post-workout, or Micro-Factor in AM)."
    : "User is OPTED-OUT. Suggest generic nutrition.";

  const prompt = `
    You are 'The System'. Generate 3 quests for today.
    
    STATUS: Energy ${energy}/10, Pain ${pain}/10.
    PROGRAM: ${programContext}
    CLASS: ${classContext}
    CONTEXT: ${supplementContext}

    LOGIC:
    1. If Pain > 7 or Energy < 4, IGNORE the training program and generate a "Recovery Quest".
    2. Main Quest: Extract a workout from their program or create a specialized one.
    3. Daily Quest: Nutrition/Habit.
    4. Side Quest: Mental/Intellect/Organization.
    
    Return JSON array.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              xpReward: { type: Type.INTEGER },
              type: { type: Type.STRING, enum: [QuestType.MAIN, QuestType.DAILY, QuestType.SIDE] }
            }
          }
        }
      }
    });

    const data = JSON.parse(response.text);
    return data.map((q: any, index: number) => ({
      id: `generated-${Date.now()}-${index}`,
      title: q.title,
      description: q.description,
      xpReward: q.xpReward,
      type: q.type as QuestType,
      completed: false
    }));

  } catch (error) {
    return getMockQuests(energy, pain);
  }
};

export const generateSupplementLoadout = async (profile: PlayerProfile): Promise<InventoryItem[]> => {
  // If no API key or invalid profile, return defaults
  if (!apiKey || !profile.intakeData) {
     return PRODUCT_CATALOG.slice(0, 4).map(i => ({...i, reason: "Standard Issue Starter Pack"}));
  }

  const model = "gemini-2.5-flash";
  const catalogNames = PRODUCT_CATALOG.map(p => p.name).join(", ");
  
  const prompt = `
    You are the Quartermaster AI for a 'Solo Leveling' fitness app.
    
    USER PROFILE:
    - Class: ${profile.intakeData.battleClass}
    - Goal: ${profile.intakeData.primaryGoal}
    - Gender: ${profile.intakeData.gender}
    - Injuries: ${profile.intakeData.injuries}
    
    AVAILABLE CATALOG: ${catalogNames}
    
    TASK:
    Select the top 4 most essential products from the catalog for this user.
    For each item, provide a "reason" in 1 sentence using RPG/Gaming terminology (e.g., "Required to repair structural damage..." or "Boosts mana regeneration...").
    
    Return JSON: { "recommendations": [ { "name": "Exact Name From Catalog", "reason": "RPG Reason" } ] }
  `;

  try {
     const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
           responseMimeType: "application/json",
           responseSchema: {
              type: Type.OBJECT,
              properties: {
                 recommendations: {
                    type: Type.ARRAY,
                    items: {
                       type: Type.OBJECT,
                       properties: {
                          name: { type: Type.STRING },
                          reason: { type: Type.STRING }
                       }
                    }
                 }
              }
           }
        }
     });
     
     const result = JSON.parse(response.text);
     
     // Map back to full catalog objects
     const loadout: InventoryItem[] = [];
     result.recommendations.forEach((rec: any) => {
        const item = PRODUCT_CATALOG.find(p => p.name === rec.name);
        if (item) {
           loadout.push({ ...item, reason: rec.reason });
        }
     });
     
     return loadout.length > 0 ? loadout : PRODUCT_CATALOG.slice(0, 4);

  } catch (e) {
     console.error("Supp generation failed", e);
     return PRODUCT_CATALOG.slice(0, 4).map(i => ({...i, reason: "System Offline: Standard Issue Pack"}));
  }
}
