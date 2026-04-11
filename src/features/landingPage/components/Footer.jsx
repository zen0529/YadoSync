export const Footer = () => {
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer className="bg-[#3aab4a] text-white py-14 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          {/* Col 1 - Brand */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold font-[Poppins]">YadoManagement</h3>
            <p className="text-white/80 text-sm font-[Poppins]">Manage every stay, everywhere.</p>
            <div className="flex items-center gap-3 pt-1">
              <a href="#" className="text-white/80 hover:text-white transition-colors" aria-label="Facebook">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" /></svg>
              </a>
              <a href="#" className="text-white/80 hover:text-white transition-colors" aria-label="Instagram">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
              </a>
              <a href="#" className="text-white/80 hover:text-white transition-colors" aria-label="TikTok">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.49a8.23 8.23 0 003.76.96V6.02a4.84 4.84 0 01-.01.67z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Col 2 - About */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold font-[Poppins] uppercase tracking-wider">About YadoManagement</h4>
            <nav className="flex flex-col gap-2">
              {[
                { label: "Home", id: "hero" },
                { label: "How It Works", id: "how-it-works" },
                { label: "Features", id: "features" },
                { label: "Contact Us", id: "contact" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className="text-white/80 hover:text-white text-sm font-[Poppins] transition-colors text-left"
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Col 3 - Platforms */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold font-[Poppins] uppercase tracking-wider">Platforms</h4>
            <div className="flex flex-col gap-2">
              {["Booking.com", "Agoda", "Airbnb", "Traveloka"].map((platform) => (
                <span key={platform} className="text-white/80 text-sm font-[Poppins]">{platform}</span>
              ))}
            </div>
          </div>

          {/* Col 4 - Locations */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold font-[Poppins] uppercase tracking-wider">Locations</h4>
            <div className="flex flex-col gap-2">
              {["Cebu", "Palawan", "Siargao", "Boracay", "Batangas"].map((loc) => (
                <span key={loc} className="text-white/80 text-sm font-[Poppins]">{loc}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/20 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-white/70 text-xs font-[Poppins]">&copy; 2026 YadoManagement. All rights reserved.</p>
          <p className="text-white/70 text-xs font-[Poppins]">Built for accommodation owners everywhere.</p>
        </div>
      </div>
    </footer>
  );
};
