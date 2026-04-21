import React from "react";

const Spinner = () => {
  return (
    <div className="flex flex-col items-center justify-center p-12 gap-4 animate-in fade-in zoom-in duration-700">
      <div className="relative w-16 h-16">
        {/* Outer Ring */}
        <div className="absolute inset-0 rounded-full border-2 border-[#ae8fff]/10" />
        
        {/* Sweeping Arc */}
        <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-[#ae8fff] animate-[spin_1.2s_cubic-bezier(0.4,0,0.2,1)_infinite] shadow-[0_0_15px_rgba(174,143,255,0.4)]" />
        
        {/* Central Pulse */}
        <div className="absolute inset-4 rounded-full bg-[#ae8fff]/20 animate-pulse" />
      </div>
      
      <p className="text-[#ae8fff]/60 text-xs font-medium uppercase tracking-[0.2em] animate-pulse">
        Initializing...
      </p>
    </div>
  );
};

export default Spinner;
