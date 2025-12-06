
import React, { useState, useEffect } from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'outline' | 'ghost' | 'system';
  icon?: LucideIcon;
  isLoading?: boolean;
}

export const RPGButton: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  icon: Icon,
  isLoading,
  ...props 
}) => {
  const baseStyles = "relative px-6 py-3 font-mono text-sm uppercase tracking-widest transition-all duration-200 clip-rpg-button disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group active:scale-95";
  
  const variants = {
    primary: "bg-neon-blue text-black hover:bg-white hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] font-bold border-l-4 border-white",
    system: "bg-slate-800 text-neon-blue border border-neon-blue hover:bg-neon-blue hover:text-black font-bold shadow-[0_0_10px_rgba(59,130,246,0.2)]",
    danger: "bg-neon-red text-black hover:bg-white hover:shadow-[0_0_20px_rgba(239,68,68,0.6)] font-bold border-l-4 border-white",
    outline: "bg-transparent border border-neon-blue text-neon-blue hover:bg-neon-blue/10 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]",
    ghost: "text-slate-400 hover:text-white hover:bg-white/5",
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4" />
      ) : null}
      {children}
    </button>
  );
};

export const StatBar: React.FC<{ label: string; value: number; max: number; color: string }> = ({ label, value, max, color }) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  return (
    <div className="w-full mb-3 group">
      <div className="flex justify-between text-[10px] font-mono uppercase mb-1 tracking-wider">
        <span className="text-slate-400 group-hover:text-white transition-colors">{label}</span>
        <span style={{ color }}>{value} <span className="text-slate-600">/ {max}</span></span>
      </div>
      <div className="h-3 bg-black w-full relative overflow-hidden border border-slate-800 skew-x-[-10deg]">
        <div 
          className="h-full transition-all duration-700 ease-out relative"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse-slow" />
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50" />
        </div>
      </div>
    </div>
  );
};

export const Panel: React.FC<{ title?: string; children: React.ReactNode; className?: string; action?: React.ReactNode }> = ({ title, children, className = '', action }) => (
  <div className={`bg-system-panel border border-slate-800 p-5 relative clip-rpg-panel ${className}`}>
    {/* Decorative corner lines */}
    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-slate-700 pointer-events-none opacity-50" />
    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-slate-700 pointer-events-none opacity-50" />
    
    {(title || action) && (
      <div className="flex justify-between items-center mb-5 border-b border-slate-800 pb-2">
        {title && (
          <h3 className="text-neon-blue font-mono uppercase tracking-[0.2em] text-xs font-bold flex items-center gap-2">
            <span className="w-2 h-2 bg-neon-blue rotate-45 inline-block" />
            {title}
          </h3>
        )}
        {action}
      </div>
    )}
    {children}
  </div>
);

// A translucent, glowing window inspired by the webtoon system messages
export const SystemWindow: React.FC<{ children: React.ReactNode; className?: string; type?: 'info' | 'alert' | 'success' }> = ({ children, className = '', type = 'info' }) => {
  const colors = {
    info: 'border-neon-blue bg-neon-blue/10 shadow-[0_0_30px_rgba(59,130,246,0.1)]',
    alert: 'border-neon-red bg-neon-red/10 shadow-[0_0_30px_rgba(239,68,68,0.1)]',
    success: 'border-neon-green bg-neon-green/10 shadow-[0_0_30px_rgba(34,197,94,0.1)]',
  };

  return (
    <div className={`backdrop-blur-md border ${colors[type]} p-6 relative ${className}`}>
       <div className="absolute top-0 left-0 w-2 h-2 bg-white" />
       <div className="absolute top-0 right-0 w-2 h-2 bg-white" />
       <div className="absolute bottom-0 left-0 w-2 h-2 bg-white" />
       <div className="absolute bottom-0 right-0 w-2 h-2 bg-white" />
       {children}
    </div>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, className, ...props }) => (
  <div className="mb-4">
    {label && <label className="block text-xs uppercase text-slate-500 mb-1 font-mono tracking-widest">{label}</label>}
    <div className="relative group">
      <input 
        className={`w-full bg-black border border-slate-800 text-white px-4 py-3 focus:border-neon-blue focus:outline-none focus:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all font-mono placeholder:text-slate-700 clip-rpg-button ${className}`}
        {...props}
      />
      <div className="absolute bottom-0 right-0 h-[2px] w-0 bg-neon-blue transition-all duration-300 group-focus-within:w-full" />
    </div>
  </div>
);

export const TypewriterText: React.FC<{ text: string; speed?: number; className?: string }> = ({ text, speed = 30, className = '' }) => {
  const [displayed, setDisplayed] = useState('');
  
  useEffect(() => {
    let i = 0;
    setDisplayed('');
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayed(prev => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return <span className={`font-mono ${className}`}>{displayed}</span>;
}
