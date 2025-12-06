
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Shield, Activity, Sword, Scroll, User, Settings, 
  MessageSquare, ShoppingBag, CheckCircle, AlertTriangle, 
  Lock, ArrowRight, Zap, Skull, ThumbsUp, ThumbsDown, Minus,
  ChevronRight, ChevronLeft, Calendar, FileText, Info, ExternalLink,
  Power, Terminal, Eye, Dumbbell, Bell, Target, Crosshair, Share2, Download
} from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';

import { PlayerProfile, Quest, QuestType, InventoryItem, DailyStatus, IntakeData, BattleClass } from './types';
import { RPGButton, StatBar, Panel, Input, SystemWindow, TypewriterText } from './components/UIComponents';
import { generateDailyQuests, generateOnboardingPlan, generateSupplementLoadout } from './services/geminiService';

// --- Constants & Data ---

const INITIAL_STATS = { strength: 5, agility: 5, constitution: 5, intellect: 5 };
const COACH_AFFILIATE_LINK = "https://1stphorm.com/DrewOnMisson";

const BATTLE_CLASSES = [
  { 
    id: 'ASSASSIN', 
    name: 'Shadow Monarch', 
    icon: Sword,
    color: 'text-neon-purple',
    desc: 'Focus on speed, agility, and explosive power. Mastery of bodyweight and calisthenics.',
    quests: 'HIIT, Plyometrics, Mobility'
  },
  { 
    id: 'TANK', 
    name: 'Iron Titan', 
    icon: Shield,
    color: 'text-neon-red',
    desc: 'Focus on raw strength, mass, and durability. Moving heavy objects is the primary directive.',
    quests: 'Powerlifting, Heavy Compounds'
  },
  { 
    id: 'MAGE', 
    name: 'Arcane Strategist', 
    icon: Zap,
    color: 'text-neon-blue',
    desc: 'Focus on intellect, precision, and bio-hacking. Optimization of form and recovery.',
    quests: 'Tempo Training, Pre-hab'
  },
  { 
    id: 'RANGER', 
    name: 'Storm Bringer', 
    icon: Target,
    color: 'text-neon-green',
    desc: 'Focus on endurance, stamina, and hybrid capability. Relentless forward motion.',
    quests: 'Running, Rucking, Circuits'
  }
];

const INTAKE_QUESTIONS = [
  { id: 'age', label: 'Age', type: 'number' },
  { id: 'gender', label: 'Gender Identity', type: 'select', options: ['Male', 'Female', 'Non-Binary', 'Prefer not to say'] },
  { id: 'height', label: 'Height', type: 'text' },
  { id: 'weight', label: 'Current Weight', type: 'text' },
  { id: 'primaryGoal', label: 'Primary Objective', type: 'select', options: ['Fat Loss', 'Muscle Gain', 'Strength', 'Athletic Performance'] },
  { id: 'injuries', label: 'Existing Physical Structural Damage (Injuries)', type: 'textarea' },
  { id: 'chronicConditions', label: 'Chronic Debuffs (Conditions/Illnesses)', type: 'textarea' },
  { id: 'medications', label: 'Active Potions/Medications', type: 'textarea' },
  { id: 'experienceLevel', label: 'Combat Experience (Gym Experience)', type: 'select', options: ['Beginner (Rank E)', 'Intermediate (Rank C)', 'Advanced (Rank S)'] },
  { id: 'daysAvailable', label: 'Deployments Per Week (Days Available)', type: 'number' },
  { id: 'timeAvailable', label: 'Mission Duration Limit (Mins per day)', type: 'number' },
  { id: 'occupation', label: 'Daily Occupation Type', type: 'select', options: ['Sedentary (Desk)', 'Active (Manual Labor)', 'Mixed'] },
  { id: 'stressLevel', label: 'Stress Level (1-10)', type: 'range' },
  { id: 'sleepQuality', label: 'Sleep Quality (1-10)', type: 'range' },
  { id: 'dietType', label: 'Fuel Source (Diet Type)', type: 'select', options: ['Omnivore', 'Vegan', 'Keto', 'Paleo', 'None'] },
  { id: 'mealsPerDay', label: 'Refuel Frequency (Meals/Day)', type: 'number' },
  { id: 'waterIntake', label: 'Hydration Level (Liters/Day)', type: 'text' },
  { id: 'alcohol', label: 'Poison Intake (Alcohol freq)', type: 'text' },
  { id: 'smoker', label: 'Smoke/Vape?', type: 'select', options: ['No', 'Yes'] },
  { id: 'allergies', label: 'Food Allergies', type: 'text' },
  { id: 'gymAccess', label: 'Training Environment', type: 'select', options: ['Full Gym', 'Home Gym', 'Bodyweight Only'] },
  { id: 'motivation', label: 'Why do you want to become a Villain?', type: 'textarea' },
  { id: 'optInSupplements', label: 'Initialize 1st Phorm Integration? (Required for full access after trial)', type: 'custom_1stphorm' },
];

const calculateDaysRemaining = (user: PlayerProfile) => {
  const TRIAL_LENGTH_MS = 7 * 24 * 60 * 60 * 1000;
  const elapsed = Date.now() - user.trialStartDate;
  const remaining = TRIAL_LENGTH_MS - elapsed;
  return Math.max(0, Math.ceil(remaining / (1000 * 60 * 60 * 24)));
};

const isLocked = (user: PlayerProfile) => {
  if (user.subscriptionActive || user.id === 'admin') return false;
  return calculateDaysRemaining(user) <= 0;
};

// --- Main Component ---

const App: React.FC = () => {
  // --- Global State ---
  const [view, setView] = useState<'title' | 'login' | 'signup' | 'classSelection' | 'intake' | 'awakening' | 'hud' | 'training' | 'quests' | 'inventory' | 'chat' | 'admin'>('title');
  const [systemMessage, setSystemMessage] = useState<string | null>(null);
  const [isPWAInstalled, setIsPWAInstalled] = useState(true); // Default to true to prevent flash
  
  // Players Data (Persisted)
  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<PlayerProfile | null>(null);
  
  // Intake Form State
  const [intakeStep, setIntakeStep] = useState(0);
  const [intakeData, setIntakeData] = useState<Partial<IntakeData>>({});

  // Daily State
  const [dailyCheck, setDailyCheck] = useState<DailyStatus>({ date: new Date().toDateString(), energy: 5, pain: 0, completed: false });
  const [quests, setQuests] = useState<Quest[]>([]);
  const [questHistory, setQuestHistory] = useState<Quest[]>([]);
  const [messages, setMessages] = useState<{sender: string, text: string}[]>([
    { sender: 'The Architect', text: 'Welcome, Player. I am The Architect (Coach Drew). System initialization complete. Awaiting your input.' }
  ]);
  const [loading, setLoading] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [availableStatPoints, setAvailableStatPoints] = useState(0);

  // --- Persistence Effect ---
  useEffect(() => {
    const savedPlayers = localStorage.getItem('system_players');
    if (savedPlayers) {
      setPlayers(JSON.parse(savedPlayers));
    }
    
    // Check PWA Status
    if (typeof window !== 'undefined') {
       const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
       setIsPWAInstalled(!!isStandalone);
    }
  }, []);

  useEffect(() => {
    if (players.length > 0) {
      localStorage.setItem('system_players', JSON.stringify(players));
    }
  }, [players]);

  useEffect(() => {
    if (systemMessage) {
      const timer = setTimeout(() => setSystemMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [systemMessage]);

  // --- Notification & Smart Product Recommendation Engine ---
  useEffect(() => {
    if (!currentUser || view === 'title' || view === 'login' || view === 'signup') return;

    // 1. Browser Notification Request
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    // 2. Periodic Reminder (Every minute for demo, realistically every hour)
    const notificationInterval = setInterval(() => {
      const hour = new Date().getHours();
      
      // Quest Reminder Logic (e.g., if it's past 10AM and quests aren't done)
      if (hour > 10 && quests.length > 0 && !quests.every(q => q.completed)) {
        if (Notification.permission === "granted") {
          new Notification("SYSTEM ALERT", { body: "Daily Directives Incomplete. The System awaits your progress." });
        }
      }
      
      // Merchant/Product Recommendation Logic (Random Trigger)
      if (Math.random() > 0.95 && !systemMessage) { // 5% chance per tick
         let productMsg = "Recommended: Micro-Factor for daily optimization.";
         if (currentUser.intakeData?.battleClass === 'TANK') {
            productMsg = "Class Tip: Creatine Monohydrate essential for Iron Titan power output.";
         } else if (currentUser.intakeData?.battleClass === 'MAGE') {
            productMsg = "Class Tip: Opti-Greens 50 required to maintain cognitive baseline.";
         }
         setSystemMessage(`🛒 MERCHANT UPLINK: ${productMsg}`);
      }

    }, 30000); 

    return () => clearInterval(notificationInterval);
  }, [currentUser, quests, view, systemMessage]);

  // --- Inventory Generation Effect ---
  useEffect(() => {
    const fetchInventory = async () => {
       if (currentUser && currentUser.intakeData?.optInSupplements && (!currentUser.inventory || currentUser.inventory.length === 0)) {
           // If opted in but no inventory, generate it
           const loadout = await generateSupplementLoadout(currentUser);
           const updatedUser = { ...currentUser, inventory: loadout };
           setCurrentUser(updatedUser);
           setPlayers(prev => prev.map(p => p.id === updatedUser.id ? updatedUser : p));
           showSystemMsg("ARMORY REQUISITIONS PROCESSED");
       }
    }
    
    if (view === 'inventory' || view === 'awakening') {
       fetchInventory();
    }
  }, [view, currentUser]);


  const showSystemMsg = (msg: string) => {
    setSystemMessage(msg);
  };

  const handleShare = async () => {
    const shareData = {
      title: 'The System: Villain Arc',
      text: 'Status: AWAKENED. I have begun my Villain Arc. Join "The System" and level up your life.',
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        showSystemMsg("UPLINK BROADCAST SUCCESSFUL");
      } catch (err) {
        console.error('Share failed', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      showSystemMsg("UPLINK COPIED TO CLIPBOARD");
    }
  };

  const handleInstallClick = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIOS) {
       alert("iOS INSTALL PROTOCOL:\n1. Tap the 'Share' button in your browser toolbar.\n2. Scroll down and select 'Add to Home Screen'.\n3. Launch from your home screen.");
    } else {
       alert("ANDROID INSTALL PROTOCOL:\n1. Tap the browser menu (three dots).\n2. Select 'Install App' or 'Add to Home Screen'.");
    }
  };

  // --- Handlers ---

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;

    if (email === 'drew@system.com') {
      const admin: PlayerProfile = {
        id: 'admin', name: 'Coach Drew', email, level: 99, currentXp: 9999, xpToNextLevel: 10000,
        stats: { strength: 99, agility: 99, constitution: 99, intellect: 99 },
        title: 'The Architect', status: 'VILLAIN', streak: 999, fatigueDebuff: false,
        trialStartDate: Date.now(), subscriptionActive: true
      };
      setCurrentUser(admin);
      setView('admin');
      showSystemMsg("ADMINISTRATOR ACCESS GRANTED");
    } else {
      const existing = players.find(p => p.email === email);
      if (existing) {
        setCurrentUser(existing);
        setView('hud');
        showSystemMsg(`WELCOME BACK, ${existing.name.toUpperCase()}`);
      } else {
        alert("PLAYER NOT FOUND. PLEASE SELECT 'NEW GAME' TO INITIALIZE.");
      }
    }
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    
    // Create temp user
    const newId = `player-${Date.now()}`;
    setCurrentUser({
      id: newId, name: 'Player One', email, level: 1, currentXp: 0, xpToNextLevel: 100,
      stats: INITIAL_STATS, title: 'Pending Awakening', status: 'PENDING', streak: 0, fatigueDebuff: false,
      trialStartDate: Date.now(), subscriptionActive: false
    });
    // Go to Class Selection FIRST
    setView('classSelection');
    showSystemMsg("NEW PLAYER DETECTED. SELECT YOUR COMBAT STYLE.");
  };

  const handleClassSelect = (battleClass: BattleClass) => {
    setIntakeData(prev => ({ ...prev, battleClass }));
    setView('intake');
  };

  const handleIntakeSubmit = async () => {
    setLoading(true);
    if (!currentUser) return;

    // Trigger AI Generation
    const result = await generateOnboardingPlan(intakeData as IntakeData);
    let inventory: InventoryItem[] = [];
    
    // Pre-fetch inventory if opted in
    if (intakeData.optInSupplements) {
        inventory = await generateSupplementLoadout({ ...currentUser, intakeData: intakeData as IntakeData });
    }
    
    const finalizedUser: PlayerProfile = {
      ...currentUser,
      status: 'AWAKENED',
      intakeData: intakeData as IntakeData,
      title: result.initialTitle,
      projectedStats: result.projectedStats,
      trainingProgram: result.trainingProgram, // Saved customized program
      subscriptionActive: intakeData.optInSupplements || false,
      inventory
    };

    setPlayers(prev => {
      // Remove placeholder if exists
      const filtered = prev.filter(p => p.id !== currentUser.id);
      return [...filtered, finalizedUser];
    });
    setCurrentUser(finalizedUser);
    setLoading(false);
    
    // Trigger Awakening Sequence instead of going straight to HUD
    setView('awakening');
  };

  const handleStatusCheckSubmit = async () => {
    setLoading(true);
    if (currentUser) {
      const generatedQuests = await generateDailyQuests(dailyCheck.energy, dailyCheck.pain, currentUser, questHistory);
      setQuests(generatedQuests);
      setDailyCheck(prev => ({ ...prev, completed: true }));
      setLoading(false);
      showSystemMsg("DAILY MANDATES ISSUED");
    }
  };

  const handleQuestComplete = (questId: string, rating: 'Excellent' | 'Good' | 'Poor') => {
    if (!currentUser) return;
    setQuests(prev => prev.map(q => q.id === questId ? { ...q, completed: true, quality: rating } : q));
    
    const quest = quests.find(q => q.id === questId);
    if (quest) {
      const updatedUser = { ...currentUser };
      updatedUser.currentXp += quest.xpReward;
      setQuestHistory(prev => [...prev, { ...quest, completed: true, quality: rating }]);

      if (updatedUser.currentXp >= updatedUser.xpToNextLevel) {
        updatedUser.level += 1;
        updatedUser.currentXp -= updatedUser.xpToNextLevel;
        updatedUser.xpToNextLevel = Math.floor(updatedUser.xpToNextLevel * 1.2);
        setAvailableStatPoints(prev => prev + 3);
        setShowLevelUp(true);
        showSystemMsg("LEVEL UP! ATTRIBUTE POINTS AWARDED.");
      } else {
        showSystemMsg(`QUEST COMPLETE: +${quest.xpReward} XP`);
      }
      setCurrentUser(updatedUser);
      setPlayers(prev => prev.map(p => p.id === updatedUser.id ? updatedUser : p));
    }
  };

  // --- Render Helpers ---

  // System Notification Component
  const SystemNotification = () => (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300 ${systemMessage ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
      <div className="bg-neon-blue/10 backdrop-blur-md border border-neon-blue text-neon-blue px-6 py-3 font-mono text-sm uppercase tracking-widest clip-rpg-button shadow-[0_0_20px_rgba(59,130,246,0.3)] flex items-center gap-3">
        {systemMessage && systemMessage.includes('MERCHANT') ? <ShoppingBag className="animate-pulse text-neon-green" size={16} /> : <Info className="animate-pulse" size={16} />}
        {systemMessage}
      </div>
    </div>
  );

  // --- Views ---

  // 1. Title Screen
  if (view === 'title') {
    return (
      <div className="min-h-screen bg-system-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30 animate-pulse-slow"></div>
        <div className="z-10 text-center space-y-12">
           <div className="space-y-2">
             <div className="text-neon-blue font-mono text-sm tracking-[0.5em] animate-pulse">SYSTEM ONLINE</div>
             <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter italic drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
               THE SYSTEM
             </h1>
             <div className="text-neon-purple font-mono text-xl md:text-2xl tracking-widest bg-black/50 inline-block px-4 py-1 border border-neon-purple/30 transform -skew-x-12">
               VILLAIN ARC INITIATED
             </div>
           </div>

           <div className="flex flex-col gap-4 w-full max-w-xs mx-auto">
             <RPGButton onClick={() => setView('login')} variant="outline" className="w-full text-lg py-4">
               CONTINUE
             </RPGButton>
             <RPGButton onClick={() => setView('signup')} variant="primary" className="w-full text-lg py-4">
               NEW GAME
             </RPGButton>
           </div>
           
           <div className="text-[10px] text-slate-600 font-mono tracking-widest mt-12">
             VER 2.5.0 // ARCHITECT: COACH DREW
           </div>
        </div>
      </div>
    );
  }

  // 2. Login Screen
  if (view === 'login') {
    return (
      <div className="min-h-screen bg-system-black flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-system-panel border border-slate-800 p-8 clip-rpg-panel relative">
           <button onClick={() => setView('title')} className="absolute top-4 right-4 text-slate-500 hover:text-white"><Minus size={20}/></button>
           <h2 className="text-3xl font-black text-white mb-2 uppercase italic">Identify Yourself</h2>
           <p className="text-neon-blue font-mono text-xs mb-8 tracking-widest">ENTER CREDENTIALS</p>
           <form onSubmit={handleLogin} className="space-y-6">
             <Input name="email" type="email" placeholder="EMAIL ADDRESS" required autoFocus />
             <Input name="password" type="password" placeholder="PASSWORD" required />
             <RPGButton type="submit" className="w-full">ACCESS SYSTEM</RPGButton>
           </form>
        </div>
      </div>
    );
  }

  // 3. Sign Up Screen
  if (view === 'signup') {
    return (
      <div className="min-h-screen bg-system-black flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-system-panel border border-slate-800 p-8 clip-rpg-panel relative">
           <button onClick={() => setView('title')} className="absolute top-4 right-4 text-slate-500 hover:text-white"><Minus size={20}/></button>
           <h2 className="text-3xl font-black text-white mb-2 uppercase italic">Player Registration</h2>
           <p className="text-neon-green font-mono text-xs mb-8 tracking-widest">CREATE NEW PROFILE</p>
           <form onSubmit={handleSignUp} className="space-y-6">
             <Input name="email" type="email" placeholder="ENTER EMAIL" required autoFocus />
             <Input name="password" type="password" placeholder="CREATE PASSWORD" required />
             <RPGButton type="submit" variant="primary" className="w-full">INITIALIZE</RPGButton>
           </form>
           <div className="mt-4 text-center text-[10px] text-slate-500 font-mono">
             * By continuing, you agree to The System's protocols.
           </div>
        </div>
      </div>
    );
  }

  // 3.5 Class Selection Screen
  if (view === 'classSelection') {
    return (
      <div className="min-h-screen bg-system-black p-4 md:p-8 flex flex-col items-center justify-center">
         <header className="mb-8 text-center space-y-2">
            <h2 className="text-4xl font-black text-white italic tracking-tighter">SELECT COMBAT CLASS</h2>
            <p className="text-neon-blue font-mono text-xs tracking-widest">DETERMINES TRAINING STYLE & QUEST PARAMETERS</p>
         </header>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
            {BATTLE_CLASSES.map((cls) => (
               <div key={cls.id} 
                    onClick={() => handleClassSelect(cls.id as BattleClass)}
                    className="group relative bg-system-panel border border-slate-800 p-6 clip-rpg-panel cursor-pointer hover:bg-slate-900 transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(59,130,246,0.1)]">
                  <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-current to-transparent opacity-50 ${cls.color}`} />
                  <div className="flex items-start gap-4">
                     <div className={`p-4 bg-black border border-slate-700 ${cls.color} group-hover:scale-110 transition-transform`}>
                        <cls.icon size={32} />
                     </div>
                     <div>
                        <h3 className={`text-2xl font-black italic uppercase ${cls.color} mb-1`}>{cls.name}</h3>
                        <p className="text-slate-400 text-xs font-mono leading-relaxed mb-3">{cls.desc}</p>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 border-t border-slate-800 pt-2 mt-2">
                           System Directives: <span className="text-white">{cls.quests}</span>
                        </div>
                     </div>
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <ArrowRight className="text-white" size={20} />
                  </div>
               </div>
            ))}
         </div>
      </div>
    )
  }

  // 4. Intake Wizard
  if (view === 'intake') {
    const questionsPerPage = 5;
    const totalPages = Math.ceil(INTAKE_QUESTIONS.length / questionsPerPage);
    const currentQuestions = INTAKE_QUESTIONS.slice(intakeStep * questionsPerPage, (intakeStep + 1) * questionsPerPage);

    return (
      <div className="min-h-screen bg-system-black p-4 md:p-8">
        <SystemNotification />
        <div className="max-w-2xl mx-auto space-y-6">
          <header className="mb-8 border-b border-slate-800 pb-4">
             <div className="flex justify-between items-center mb-2">
               <div className="flex flex-col">
                  <h2 className="text-3xl font-black text-white italic tracking-tighter">CHARACTER CREATION</h2>
                  <div className="text-[10px] text-neon-purple font-mono uppercase tracking-widest mt-1">CLASS: {intakeData.battleClass || 'UNKNOWN'}</div>
               </div>
               <div className="text-neon-blue font-mono text-xl font-bold">{Math.round(((intakeStep + 1) / totalPages) * 100)}%</div>
             </div>
             <div className="w-full h-2 bg-black border border-slate-800 skew-x-[-15deg]">
               <div className="h-full bg-neon-blue transition-all duration-300" style={{ width: `${((intakeStep + 1) / totalPages) * 100}%` }} />
             </div>
          </header>

          <div className="space-y-8 animate-fade-in">
            {currentQuestions.map(q => {
               if (q.type === 'custom_1stphorm') {
                 return (
                   <div key={q.id} className="bg-gradient-to-br from-slate-900 to-black border border-neon-blue/30 p-6 relative overflow-hidden clip-rpg-panel">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Shield size={140} className="text-white" />
                      </div>
                      
                      <div className="flex items-center gap-3 mb-4">
                        <Shield className="text-neon-blue" />
                        <h3 className="text-2xl font-bold text-white uppercase italic">Alliance Protocol</h3>
                      </div>
                      <div className="text-neon-blue font-mono text-xs mb-6 uppercase tracking-[0.2em] border-b border-slate-800 pb-2">Authorized Partner: 1st Phorm</div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-4 relative z-10">
                           <p className="text-slate-300 text-sm leading-relaxed font-mono">
                             To achieve <span className="text-white font-bold">Villain Status</span>, The Architect demands the highest quality fuel. We integrate with 1st Phorm because they embody the standard.
                           </p>
                           <ul className="space-y-2 text-xs font-mono text-slate-400">
                             <li className="flex items-center gap-2 text-neon-green"><CheckCircle size={14} /> Pharmaceutical Grade Mfg</li>
                             <li className="flex items-center gap-2 text-neon-green"><CheckCircle size={14} /> Low Temp Processing</li>
                             <li className="flex items-center gap-2 text-neon-green"><CheckCircle size={14} /> 110% Guarantee</li>
                           </ul>
                        </div>
                        <div className="bg-black/50 p-4 border border-slate-700 flex flex-col justify-center items-center">
                           <div className="text-neon-green text-4xl font-black mb-1 italic">110%</div>
                           <div className="text-[10px] uppercase tracking-widest text-slate-500">Satisfaction Guarantee</div>
                        </div>
                      </div>

                      <div className="bg-neon-blue/10 p-4 border border-neon-blue/30 hover:bg-neon-blue/20 transition-colors">
                         <label className="flex items-start gap-4 cursor-pointer group">
                            <div className={`mt-1 min-w-[24px] h-6 border-2 flex items-center justify-center transition-colors ${intakeData.optInSupplements ? 'bg-neon-blue border-neon-blue' : 'border-slate-600'}`}>
                              {intakeData.optInSupplements && <CheckCircle size={14} className="text-black" />}
                            </div>
                            <input type="checkbox" className="hidden" onChange={(e) => setIntakeData(prev => ({...prev, optInSupplements: e.target.checked}))} checked={!!intakeData.optInSupplements} />
                            <div>
                               <div className="text-white font-bold group-hover:text-neon-blue transition-colors uppercase tracking-wider">Activate Protocol (Recommended)</div>
                               <p className="text-[10px] text-slate-400 mt-1 font-mono">
                                 Unlocks specific nutrient timing quests and extended trial access.
                               </p>
                            </div>
                          </label>
                      </div>
                   </div>
                 )
               }

               return (
                <div key={q.id} className="space-y-2">
                  <label className="text-xs font-mono text-neon-blue uppercase tracking-widest block pl-1 border-l-2 border-neon-blue">{q.label}</label>
                  {q.type === 'textarea' ? (
                    <textarea 
                      className="w-full bg-black border border-slate-800 text-white p-3 focus:border-neon-blue outline-none min-h-[100px] font-mono clip-rpg-button focus:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all"
                      onChange={(e) => setIntakeData(prev => ({...prev, [q.id]: e.target.value}))}
                      value={intakeData[q.id as keyof IntakeData] as string || ''}
                    />
                  ) : q.type === 'select' ? (
                    <select 
                      className="w-full bg-black border border-slate-800 text-white p-3 focus:border-neon-blue outline-none font-mono clip-rpg-button h-12"
                      onChange={(e) => setIntakeData(prev => ({...prev, [q.id]: e.target.value}))}
                      value={intakeData[q.id as keyof IntakeData] as string || ''}
                    >
                      <option value="">SELECT OPTION...</option>
                      {q.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : (
                    <Input 
                      type={q.type} 
                      onChange={(e) => setIntakeData(prev => ({...prev, [q.id]: e.target.value}))}
                      value={intakeData[q.id as keyof IntakeData] as string || ''}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-between pt-8 border-t border-slate-800 mt-8">
             <button 
               onClick={() => setIntakeStep(prev => Math.max(0, prev - 1))}
               disabled={intakeStep === 0}
               className="text-slate-500 disabled:opacity-0 hover:text-white flex items-center gap-2 font-mono uppercase tracking-widest text-xs"
             >
               <ChevronLeft size={14} /> Back
             </button>
             
             {intakeStep < totalPages - 1 ? (
               <RPGButton onClick={() => setIntakeStep(prev => prev + 1)} icon={ChevronRight} variant="system">Next Step</RPGButton>
             ) : (
               <RPGButton onClick={handleIntakeSubmit} isLoading={loading} variant="primary">COMPLETE SETUP</RPGButton>
             )}
          </div>
        </div>
      </div>
    )
  }

  // 5. Awakening Sequence (New Cinematic)
  if (view === 'awakening') {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute inset-0 grid-bg animate-pulse-slow opacity-20"></div>
        <div className="max-w-xl w-full space-y-8 z-10">
          <SystemWindow type="info" className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
             <div className="space-y-4 text-center">
               <h2 className="text-4xl font-black text-neon-blue italic">SYSTEM INITIALIZATION</h2>
               <div className="h-1 w-full bg-slate-800 overflow-hidden">
                 <div className="h-full bg-neon-blue animate-[width_3s_ease-out_forwards] w-full origin-left" />
               </div>
               <div className="text-left space-y-2 font-mono text-sm text-slate-400">
                 <div>> Analyizing Biometrics... <span className="text-neon-green">COMPLETE</span></div>
                 <div>> Generating Unique Training Protocol... <span className="text-neon-green">COMPLETE</span></div>
                 <div>> Requisitioning Armory Loadout... <span className="text-neon-green">COMPLETE</span></div>
                 <div>> Class Assigned: <span className="text-neon-purple font-bold">{intakeData.battleClass}</span></div>
                 <div>> Assigning Class Title: <span className="text-white font-bold">{currentUser?.title}</span></div>
                 <div>> Welcome, Player.</div>
               </div>
               <RPGButton onClick={() => setView('hud')} className="w-full mt-6 animate-pulse">AWAKEN</RPGButton>
             </div>
          </SystemWindow>
        </div>
      </div>
    );
  }

  // --- Main HUD Layout ---
  
  if (currentUser && isLocked(currentUser)) {
     return (
       <div className="min-h-screen bg-black flex items-center justify-center text-center p-6">
         <div className="max-w-lg border border-neon-red bg-neon-red/5 p-8 relative overflow-hidden clip-rpg-panel">
           <div className="absolute inset-0 grid-bg opacity-10"></div>
           <Lock className="w-16 h-16 text-neon-red mx-auto mb-6 animate-pulse" />
           <h2 className="text-3xl font-black text-white mb-2 uppercase italic">SYSTEM LOCKED</h2>
           <p className="text-neon-red font-mono mb-6 tracking-widest text-sm border-y border-neon-red/30 py-2">TRIAL PERIOD EXPIRED</p>
           <p className="text-slate-400 mb-8 font-mono text-sm">
             To continue your Villain Arc, you must initialize the 1st Phorm Integration Protocol.
           </p>
           <RPGButton onClick={() => setView('inventory')} className="w-full">ACCESS ARMORY (UPGRADE)</RPGButton>
         </div>
       </div>
     )
  }

  return (
    <div className="min-h-screen bg-system-black text-slate-200 pb-20 md:pb-0 md:pl-64 font-sans">
      <SystemNotification />

      {/* Level Up Modal */}
      {showLevelUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm">
          <div className="w-full max-w-md bg-system-panel border-2 border-neon-green p-6 m-4 shadow-[0_0_50px_rgba(34,197,94,0.2)] clip-rpg-panel relative">
            <h2 className="text-4xl font-black text-neon-green text-center mb-2 italic">LEVEL UP!</h2>
            <div className="w-full h-1 bg-neon-green mb-6" />
            <p className="text-center font-mono text-white mb-6 uppercase tracking-widest">POINTS AVAILABLE: {availableStatPoints}</p>
            <RPGButton className="w-full mt-8" onClick={() => setShowLevelUp(false)}>CONFIRM ATTRIBUTES</RPGButton>
          </div>
        </div>
      )}

      {/* Daily Status Check */}
      {!dailyCheck.completed && view !== 'admin' && view !== 'intake' && view !== 'classSelection' && view !== 'login' && view !== 'signup' && view !== 'title' && view !== 'awakening' && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
           <div className="w-full max-w-lg bg-system-panel border border-slate-700 p-8 clip-rpg-panel shadow-[0_0_50px_rgba(0,0,0,0.8)]">
             <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-widest text-center border-b border-slate-800 pb-4">Daily Diagnostics</h2>
             <div className="space-y-8">
                <div>
                   <label className="flex justify-between mb-2 text-xs font-mono text-neon-blue uppercase tracking-wider"><span>Current Energy</span><span>{dailyCheck.energy * 10}%</span></label>
                   <input type="range" min="1" max="10" value={dailyCheck.energy} onChange={(e) => setDailyCheck({...dailyCheck, energy: parseInt(e.target.value)})} className="w-full h-2 bg-slate-900 rounded-none appearance-none cursor-pointer accent-neon-blue"/>
                </div>
                <div>
                   <label className="flex justify-between mb-2 text-xs font-mono text-neon-red uppercase tracking-wider"><span>Pain Level</span><span>{dailyCheck.pain}/10</span></label>
                   <input type="range" min="0" max="10" value={dailyCheck.pain} onChange={(e) => setDailyCheck({...dailyCheck, pain: parseInt(e.target.value)})} className="w-full h-2 bg-slate-900 rounded-none appearance-none cursor-pointer accent-neon-red"/>
                </div>
                <RPGButton onClick={handleStatusCheckSubmit} className="w-full mt-4" isLoading={loading}>GENERATE DAILY QUESTS</RPGButton>
             </div>
           </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 md:top-0 md:bottom-auto md:w-64 bg-black border-t md:border-t-0 md:border-r border-slate-800 z-30 p-2 md:p-6 flex md:flex-col justify-around md:justify-start gap-1 md:gap-4">
        <div className="hidden md:block mb-8 pl-2">
          <h1 className="text-2xl font-black italic text-white tracking-tighter drop-shadow-md">THE SYSTEM</h1>
          <div className="text-[10px] text-neon-blue font-mono tracking-widest mt-1">PLAYER ID: {currentUser?.id.slice(-4)}</div>
          
          {currentUser && !currentUser.subscriptionActive && currentUser.id !== 'admin' && (
             <div className="mt-4 text-[10px] text-neon-red font-mono border border-neon-red p-2 bg-neon-red/5 clip-rpg-button text-center">
               <AlertTriangle size={12} className="inline mr-1" />
               TRIAL: {calculateDaysRemaining(currentUser)} DAYS
             </div>
          )}
        </div>
        
        <NavItem active={view === 'hud'} onClick={() => setView('hud')} icon={Activity} label="STATUS" />
        <NavItem active={view === 'training'} onClick={() => setView('training')} icon={Dumbbell} label="TRAINING" />
        <NavItem active={view === 'quests'} onClick={() => setView('quests')} icon={Scroll} label="QUESTS" alert={quests.filter(q => !q.completed).length > 0} />
        <NavItem active={view === 'inventory'} onClick={() => setView('inventory')} icon={ShoppingBag} label="ARMORY" />
        <NavItem active={view === 'chat'} onClick={() => setView('chat')} icon={MessageSquare} label="COMM-LINK" />
        
        {/* PWA Install Button (Only visible if not installed) */}
        {!isPWAInstalled && (
           <button onClick={handleInstallClick} className="md:w-full flex md:flex-row flex-col items-center gap-3 p-4 transition-all duration-200 group relative clip-rpg-button hover:pl-6 bg-neon-green/10 text-neon-green border border-neon-green/30 animate-pulse-slow">
              <Download className="w-5 h-5" />
              <span className="text-[10px] font-mono tracking-widest uppercase md:block hidden">INSTALL SYSTEM</span>
           </button>
        )}
        
        {currentUser?.id === 'admin' && (
          <NavItem active={view === 'admin'} onClick={() => setView('admin')} icon={Shield} label="GOD MODE" className="md:mt-auto text-neon-purple border-neon-purple" />
        )}

        <div className="hidden md:block mt-auto pt-8 border-t border-slate-900">
           <button onClick={() => setView('title')} className="flex items-center gap-2 text-xs font-mono text-slate-600 hover:text-white transition-colors pl-2">
             <Power size={12} /> LOGOUT
           </button>
        </div>
      </nav>

      {/* Content */}
      <main className="p-4 md:p-8 max-w-6xl mx-auto min-h-screen">
        
        {view === 'hud' && currentUser && (
          <div className="space-y-6 animate-fade-in">
            <header className="flex flex-col md:flex-row justify-between items-end border-b border-slate-800 pb-4 gap-4">
              <div>
                <div className="text-neon-blue font-mono text-xs mb-1 tracking-[0.3em] uppercase">{currentUser.title}</div>
                <h2 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter">{currentUser.name}</h2>
              </div>
              <div className="flex gap-4">
                <button onClick={handleShare} className="text-right flex items-center gap-2 bg-neon-blue/10 hover:bg-neon-blue/20 p-2 pr-4 border-r-4 border-neon-blue clip-rpg-button transition-colors">
                  <div className="p-2"><Share2 size={24} className="text-neon-blue" /></div>
                  <div className="text-right">
                     <div className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">Invite</div>
                     <div className="text-sm font-mono font-bold text-white leading-none">SHARE UPLINK</div>
                  </div>
                </button>
                <div className="text-right flex items-center gap-4 bg-slate-900/50 p-2 pr-4 border-r-4 border-neon-green clip-rpg-button">
                  <div className="text-right">
                     <div className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">Current Rank</div>
                     <div className="text-3xl font-mono font-bold text-neon-green leading-none">LVL {currentUser.level}</div>
                  </div>
                </div>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-6">
                <Panel title="Vitals">
                  <StatBar label="HP (Energy)" value={dailyCheck.energy * 10} max={100} color="#ef4444" />
                  <StatBar label="MP (Focus)" value={dailyCheck.energy * 10} max={100} color="#3b82f6" />
                  <StatBar label="XP Progress" value={currentUser.currentXp} max={currentUser.xpToNextLevel} color="#22c55e" />
                </Panel>

                <Panel title="Attributes">
                  <div className="h-64 -ml-4">
                     <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                          { subject: 'STR', A: currentUser.stats.strength, B: currentUser.projectedStats?.strength || currentUser.stats.strength + 10, fullMark: 100 },
                          { subject: 'AGI', A: currentUser.stats.agility, B: currentUser.projectedStats?.agility || currentUser.stats.agility + 10, fullMark: 100 },
                          { subject: 'CON', A: currentUser.stats.constitution, B: currentUser.projectedStats?.constitution || currentUser.stats.constitution + 10, fullMark: 100 },
                          { subject: 'INT', A: currentUser.stats.intellect, B: currentUser.projectedStats?.intellect || currentUser.stats.intellect + 10, fullMark: 100 },
                        ]}>
                          <PolarGrid stroke="#334155" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12, fontFamily: 'monospace', fontWeight: 'bold' }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                          <Radar name="Current" dataKey="A" stroke="#3b82f6" strokeWidth={2} fill="#3b82f6" fillOpacity={0.3} />
                          <Radar name="Projected (1YR)" dataKey="B" stroke="#22c55e" strokeWidth={2} fill="#22c55e" fillOpacity={0.1} />
                          <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} />
                        </RadarChart>
                     </ResponsiveContainer>
                  </div>
                </Panel>
              </div>

              <div className="lg:col-span-2 space-y-6">
                 {/* System Log */}
                <div className="bg-black border border-slate-800 p-2 font-mono text-xs h-32 overflow-y-auto opacity-70 mb-4">
                   <div className="text-neon-green">> SYSTEM INITIALIZED...</div>
                   <div className="text-slate-500">> CONNECTED TO SERVER: 1ST_PHORM_UPLINK</div>
                   <div className="text-slate-500">> TRAINING PROGRAM GENERATED: {currentUser.trainingProgram?.name}</div>
                   <div className="text-white">> WELCOME BACK, {currentUser.name.toUpperCase()}</div>
                </div>

                <Panel title="Active Directives">
                  {quests.length === 0 ? (
                    <div className="text-slate-500 font-mono text-center py-12 border border-dashed border-slate-800">
                      NO ACTIVE DIRECTIVES. STANDBY FOR ORDERS.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {quests.filter(q => !q.completed).map(quest => (
                        <QuestCard key={quest.id} quest={quest} onComplete={handleQuestComplete} />
                      ))}
                    </div>
                  )}
                </Panel>
              </div>
            </div>
          </div>
        )}

        {view === 'training' && currentUser && (
          <div className="space-y-6">
            <header className="mb-6 border-b border-slate-800 pb-4">
              <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-2">Combat Training</h2>
              <div className="text-neon-blue font-mono text-sm tracking-widest uppercase">
                 PROTOCOL: {currentUser.trainingProgram?.name || "STANDARD ISSUE"}
              </div>
              <p className="text-slate-400 font-mono text-xs mt-2 max-w-2xl">
                {currentUser.trainingProgram?.description}
              </p>
            </header>

            {!currentUser.trainingProgram ? (
               <div className="p-8 border border-dashed border-slate-700 text-center text-slate-500 font-mono">
                 NO PROGRAM DATA FOUND. PLEASE RE-INITIALIZE AT INTAKE.
               </div>
            ) : (
              <div className="grid gap-6">
                 {currentUser.trainingProgram.schedule.map((day, idx) => (
                   <Panel key={idx} className={`${day.isRestDay ? 'opacity-50 border-slate-800' : 'border-neon-blue/30'}`}>
                     <div className="flex justify-between items-center mb-4">
                       <h3 className={`font-black text-xl uppercase italic ${day.isRestDay ? 'text-slate-500' : 'text-white'}`}>
                         {day.dayName}
                       </h3>
                       <span className={`px-2 py-1 text-[10px] font-mono border ${day.isRestDay ? 'border-slate-700 text-slate-500' : 'border-neon-green text-neon-green'}`}>
                         {day.focus}
                       </span>
                     </div>
                     
                     {day.exercises.length > 0 ? (
                       <div className="space-y-3">
                         {day.exercises.map((ex, exIdx) => (
                           <div key={exIdx} className="bg-black/50 p-3 border border-slate-800 flex justify-between items-center">
                              <div>
                                <div className="text-sm font-bold text-slate-200">{ex.name}</div>
                                <div className="text-[10px] text-slate-500 font-mono">{ex.notes}</div>
                              </div>
                              <div className="text-right font-mono text-xs text-neon-blue">
                                {ex.sets} x {ex.reps}
                              </div>
                           </div>
                         ))}
                       </div>
                     ) : (
                       <div className="text-xs font-mono text-slate-600 text-center py-4">ACTIVE RECOVERY / REST</div>
                     )}
                   </Panel>
                 ))}
              </div>
            )}
          </div>
        )}

        {view === 'quests' && (
           <div className="space-y-6">
            <h2 className="text-4xl font-black text-white uppercase italic mb-6 tracking-tighter">Mission Log</h2>
            <div className="grid gap-6">
              {Object.values(QuestType).map(type => {
                 const typeQuests = quests.filter(q => q.type === type);
                 if (typeQuests.length === 0) return null;
                 return (
                   <div key={type}>
                      <h3 className="text-neon-blue font-mono mb-4 text-sm tracking-[0.2em] border-b border-neon-blue/30 pb-2 flex items-center gap-2">
                        <div className="w-2 h-2 bg-neon-blue" />
                        {type} DIRECTIVES
                      </h3>
                      <div className="space-y-3">{typeQuests.map(quest => <QuestCard key={quest.id} quest={quest} onComplete={handleQuestComplete} />)}</div>
                   </div>
                 )
              })}
            </div>
          </div>
        )}

        {view === 'inventory' && (
          <div className="space-y-6">
             <header className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
               <div>
                 <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">Armory & Potions</h2>
                 {currentUser?.inventory && currentUser.inventory.length > 0 && <p className="text-xs text-neon-blue font-mono mt-1 tracking-widest">CUSTOMIZED LOADOUT GENERATED</p>}
               </div>
               <div className="text-neon-green font-mono text-xs border border-neon-green px-2 py-1 bg-neon-green/10">1ST PHORM UPLINK ACTIVE</div>
             </header>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(currentUser?.inventory || []).map(item => (
                  <Panel key={item.id} className="hover:border-neon-purple transition-colors cursor-pointer group flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-4xl bg-black p-4 border border-slate-800 group-hover:border-neon-purple transition-colors">{item.icon}</div>
                      <span className="px-2 py-1 bg-black text-[10px] font-mono uppercase text-slate-400 border border-slate-700">{item.type}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-neon-purple uppercase">{item.name}</h3>
                    <p className="text-xs text-neon-blue font-mono mb-2 uppercase tracking-wide">{item.effect}</p>
                    {item.reason && (
                       <div className="mb-6 p-3 bg-slate-900/50 border-l-2 border-neon-purple text-[10px] text-slate-300 font-mono leading-relaxed italic">
                         <span className="text-neon-purple not-italic font-bold">SYSTEM NOTE:</span> {item.reason}
                       </div>
                    )}
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="mt-auto block w-full text-center py-3 bg-slate-900 hover:bg-neon-purple hover:text-white transition-colors text-xs font-mono uppercase tracking-widest flex items-center justify-center gap-2 clip-rpg-button">
                       Acquire Item <ExternalLink size={12} />
                    </a>
                  </Panel>
                ))}
                
                {(!currentUser?.inventory || currentUser.inventory.length === 0) && (
                   <div className="col-span-full text-center py-12 border border-dashed border-slate-800 text-slate-500 font-mono">
                     GENERATING PERSONALIZED LOADOUT...
                   </div>
                )}
             </div>
          </div>
        )}

        {view === 'chat' && (
          <div className="h-[80vh] flex flex-col bg-system-panel border border-slate-800 clip-rpg-panel">
             <div className="p-4 border-b border-slate-800 bg-black/50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 border-2 border-neon-blue bg-slate-900 flex items-center justify-center font-bold text-white overflow-hidden">
                     <Shield className="text-neon-blue" />
                   </div>
                   <div>
                     <div className="font-black text-white text-lg italic">THE ARCHITECT</div>
                     <div className="text-[10px] text-neon-blue font-mono tracking-widest flex items-center gap-2">
                       <span className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
                       ONLINE // COACH DREW
                     </div>
                   </div>
                </div>
             </div>
             <div className="flex-1 overflow-y-auto p-6 space-y-6">
               {messages.map((msg, idx) => (
                 <div key={idx} className={`flex ${msg.sender === 'The Architect' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[80%] p-4 text-sm border ${
                       msg.sender === 'The Architect' 
                       ? 'bg-slate-900 border-slate-700 text-slate-200 rounded-tr-lg rounded-br-lg rounded-bl-lg' 
                       : 'bg-neon-blue/10 border-neon-blue text-white rounded-tl-lg rounded-bl-lg rounded-br-lg text-right'
                    }`}>
                      <div className="text-[10px] font-mono opacity-50 mb-1 uppercase tracking-wider">{msg.sender}</div>
                      {msg.text}
                    </div>
                 </div>
               ))}
             </div>
             <div className="p-4 bg-black border-t border-slate-800">
                <form className="flex gap-2" onSubmit={(e) => {
                  e.preventDefault(); const input = (e.target as HTMLFormElement).elements.namedItem('msg') as HTMLInputElement;
                  if(input.value) { setMessages([...messages, { sender: 'Player One', text: input.value }]); input.value = ''; }
                }}>
                  <input name="msg" className="flex-1 bg-black border border-slate-700 px-4 py-3 text-white focus:outline-none focus:border-neon-blue font-mono text-sm" placeholder="TYPE MESSAGE..." />
                  <button type="submit" className="px-6 bg-neon-blue text-black font-bold uppercase tracking-widest hover:bg-white transition-colors clip-rpg-button">Send</button>
                </form>
             </div>
          </div>
        )}

        {view === 'admin' && (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-neon-purple/10 border border-neon-purple p-4 text-neon-purple font-mono text-center tracking-[0.2em] font-bold animate-pulse shadow-[0_0_30px_rgba(168,85,247,0.2)]">
              GOD MODE ACTIVE: WELCOME, COACH DREW (THE ARCHITECT)
            </div>
            
            {/* SECRET OPTION: ARCHITECT PROTOCOLS */}
            <Panel title="ARCHITECT PROTOCOLS [CLASSIFIED]" className="border-neon-purple/50 bg-black/80">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <RPGButton variant="system" onClick={() => showSystemMsg("SYSTEM BROADCAST: DOUBLE XP WEEKEND ACTIVATED")} className="border-neon-purple text-neon-purple hover:bg-neon-purple hover:text-white">
                    <Zap size={16} /> TRIGGER DOUBLE XP
                  </RPGButton>
                  
                  <RPGButton variant="system" onClick={() => showSystemMsg("SYSTEM BROADCAST: MASS HEAL APPLIED")} className="border-neon-green text-neon-green hover:bg-neon-green hover:text-black">
                    <Activity size={16} /> MASS RECOVERY
                  </RPGButton>
                  
                  <RPGButton variant="outline" onClick={() => window.open(COACH_AFFILIATE_LINK, '_blank')} className="border-slate-500 text-slate-400 hover:text-white hover:border-white">
                     <ExternalLink size={16} /> AFFILIATE OPS
                  </RPGButton>

                  <RPGButton variant="danger" onClick={() => {
                     const confirm = window.confirm("INITIATE WORLD RESET? THIS CANNOT BE UNDONE.");
                     if(confirm) {
                        localStorage.clear();
                        window.location.reload();
                     }
                  }}>
                    <Skull size={16} /> RESET WORLD
                  </RPGButton>
               </div>
               <div className="mt-4 p-3 bg-slate-900/50 border border-slate-700 text-xs font-mono text-slate-500">
                  <Terminal size={12} className="inline mr-2" />
                  CONSOLE OUTPUT: Waiting for command...
               </div>
            </Panel>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <Panel title="Player Database">
                  <table className="w-full text-sm text-left">
                    <thead className="text-[10px] text-slate-500 font-mono uppercase bg-slate-900/50 tracking-wider">
                       <tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Goal</th><th className="px-4 py-3">Status</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                       {players.map(p => (
                         <tr key={p.id} className="hover:bg-slate-800/50 cursor-pointer transition-colors" onClick={() => alert(JSON.stringify(p.intakeData, null, 2))}>
                           <td className="px-4 py-3 text-white font-bold">{p.name}</td>
                           <td className="px-4 py-3 text-slate-400 font-mono text-xs">{p.intakeData?.primaryGoal || 'N/A'}</td>
                           <td className="px-4 py-3"><span className={`text-[10px] px-2 py-1 border ${p.intakeData?.injuries ? 'border-neon-red text-neon-red' : 'border-neon-green text-neon-green'}`}>{p.intakeData?.injuries ? 'INJURED' : 'HEALTHY'}</span></td>
                         </tr>
                       ))}
                    </tbody>
                  </table>
                  {players.length === 0 && <div className="p-4 text-center text-slate-600 font-mono text-xs">NO PLAYERS FOUND IN DATABASE</div>}
               </Panel>
               
               <Panel title="Pending Approval Queue">
                  <div className="text-center py-8 text-slate-600 font-mono text-xs border border-dashed border-slate-800">
                    NO PENDING SOULS AWAITING JUDGMENT.
                  </div>
               </Panel>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// --- Sub-components (NavItem, QuestCard) ---

const NavItem: React.FC<{ active: boolean; onClick: () => void; icon: any; label: string; alert?: boolean; className?: string }> = ({ active, onClick, icon: Icon, label, alert, className = '' }) => (
  <button onClick={onClick} className={`md:w-full flex md:flex-row flex-col items-center gap-3 p-4 transition-all duration-200 group relative clip-rpg-button hover:pl-6 ${active ? 'bg-neon-blue text-black font-bold' : 'bg-slate-900/50 text-slate-500 hover:text-white hover:bg-slate-800'} ${className}`}>
    <Icon className={`w-5 h-5 ${active ? 'text-black' : 'text-slate-500 group-hover:text-white'}`} />
    <span className={`text-[10px] font-mono tracking-widest uppercase md:block hidden`}>{label}</span>
    {alert && <span className="absolute top-2 right-2 w-2 h-2 bg-neon-red rounded-full animate-pulse" />}
  </button>
);

const QuestCard: React.FC<{ quest: Quest; onComplete: (id: string, rating: 'Excellent' | 'Good' | 'Poor') => void }> = ({ quest, onComplete }) => {
  const isCompleted = quest.completed;
  const [isRating, setIsRating] = useState(false);
  return (
    <div className={`relative p-5 border-l-4 transition-all duration-500 ease-out group overflow-hidden ${isCompleted ? 'bg-slate-950/50 border-l-neon-green border-y border-r border-slate-900 opacity-60' : 'bg-gradient-to-r from-slate-900 via-black to-slate-900 border-l-neon-blue border-y border-r border-slate-800 hover:border-l-neon-purple hover:translate-x-1'}`}>
       <div className="relative flex items-start gap-5">
          <div className="flex flex-col items-center gap-2">
            {!isRating ? (
              <button onClick={() => !isCompleted && setIsRating(true)} disabled={isCompleted} className={`mt-1 w-8 h-8 flex items-center justify-center border-2 transition-all duration-300 transform rotate-45 ${isCompleted ? 'bg-neon-green border-neon-green text-black scale-100' : 'border-slate-600 text-transparent hover:border-neon-blue hover:shadow-[0_0_10px_rgba(59,130,246,0.5)] active:scale-95'}`}>
                <CheckCircle size={18} className={`transition-transform duration-300 -rotate-45 ${isCompleted ? 'scale-100' : 'scale-0'}`} />
              </button>
            ) : (
              <div className="flex flex-col gap-2 mt-1 animate-fade-in-up">
                 <button onClick={() => onComplete(quest.id, 'Excellent')} className="w-8 h-8 flex items-center justify-center bg-neon-blue text-black hover:bg-white text-xs font-bold transition-all clip-rpg-button" title="Excellent"><ThumbsUp size={14} /></button>
                 <button onClick={() => onComplete(quest.id, 'Good')} className="w-8 h-8 flex items-center justify-center bg-neon-green text-black hover:bg-white text-xs font-bold transition-all clip-rpg-button" title="Good"><Minus size={14} /></button>
                 <button onClick={() => onComplete(quest.id, 'Poor')} className="w-8 h-8 flex items-center justify-center bg-neon-red text-black hover:bg-white text-xs font-bold transition-all clip-rpg-button" title="Poor"><ThumbsDown size={14} /></button>
              </div>
            )}
          </div>
          <div className="flex-1 space-y-1">
             <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className={`text-[10px] font-mono tracking-widest uppercase mb-1 ${isCompleted ? 'text-neon-green' : 'text-neon-blue'}`}>{quest.type} QUEST {isCompleted && quest.quality && <span className="text-white ml-2">[{quest.quality}]</span>}</span>
                  <h4 className={`text-lg font-black uppercase tracking-tight transition-colors italic ${isCompleted ? 'text-slate-500 line-through decoration-slate-600 decoration-2' : 'text-white group-hover:text-neon-blue'}`}>{quest.title}</h4>
                </div>
                <div className={`px-2 py-1 font-mono text-[10px] font-bold border transition-colors ${isCompleted ? 'border-neon-green/30 text-neon-green bg-neon-green/10' : 'border-neon-purple/30 text-neon-purple bg-neon-purple/10 group-hover:bg-neon-purple group-hover:text-black'}`}>+{quest.xpReward} XP</div>
             </div>
             <p className={`text-sm font-mono leading-relaxed max-w-[90%] ${isCompleted ? 'text-slate-600' : 'text-slate-400 group-hover:text-slate-300'}`}>{quest.description}</p>
          </div>
       </div>
    </div>
  );
};

export default App;
