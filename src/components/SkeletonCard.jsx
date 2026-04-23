import React from 'react';

const SkeletonCard = () => {
  return (
    <div className="relative rounded-2xl overflow-hidden bg-white/5 border border-white/10 aspect-[2/3] group shadow-2xl">
      {/* Animated Shine Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
      
      {/* Skeleton Content */}
      <div className="absolute inset-0 p-4 flex flex-col justify-end gap-3 bg-gradient-to-t from-black/80 via-transparent to-transparent">
        <div className="w-2/3 h-4 bg-white/10 rounded-full" />
        <div className="flex items-center gap-3">
          <div className="w-10 h-3 bg-white/10 rounded-full" />
          <div className="w-10 h-3 bg-white/10 rounded-full" />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
};

export default SkeletonCard;
