import React from "react";

const Footer = () => {
  return (
    <footer className="w-full py-8 mt-20 border-t border-white/10 bg-primary/50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 text-sm font-medium tracking-wide">
          &copy; {new Date().getFullYear()}{" "}
          <span className="text-white font-semibold">Oasis Watch</span>. All
          rights reserved.
        </p>
        <p className="text-gray-500 text-xs flex items-center gap-2">
          Designed and Developed by{" "}
          <a
            href="https://surajganesh.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 transition-colors font-medium  decoration-blue-400/30 hover:decoration-blue-300"
          >
            Suraj Ganesh
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
