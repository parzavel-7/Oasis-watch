// src/components/Footer.jsx
import React from "react";

// Optional: get site name from env or fallback
const siteName = import.meta.env.VITE_SITE_NAME || "Oasis Movies";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 py-6 mt-10">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
        <p className="text-sm">
          &copy; {new Date().getFullYear()} {siteName}. All rights reserved.
        </p>
        <p className="text-sm mt-2 md:mt-0 md:ml-4">
          This site does not store any files on our server, we only linked to
          the media which is hosted on 3rd party services.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
