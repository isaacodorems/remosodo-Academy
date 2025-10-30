
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 mt-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-slate-400">
        <p>&copy; {new Date().getFullYear()} Remsodo Academy. All content is AI-generated.</p>
        <p className="text-sm mt-1">Powered by Google Gemini</p>
      </div>
    </footer>
  );
};

export default Footer;
