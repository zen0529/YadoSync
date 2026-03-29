import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import yadoLogo from "@/assets/logo.png";

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={`sticky top-0 z-50 bg-[#3aab4a] transition-shadow duration-300 ${scrolled ? "shadow-lg" : ""}`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <img src={yadoLogo} alt="YadoBooking" className="h-10 w-8" />
          <div className="flex flex-col">
            <span className="text-white font-bold text-lg leading-tight font-[Poppins]">YadoBooking</span>
            <span className="text-white/70 text-[10px] leading-tight font-[Poppins]">Accommodation Channel Manager</span>
          </div>
        </div>

        {/* Nav Links - hidden on mobile */}
        <div className="hidden md:flex items-center gap-8">
          {[
            { label: "Home", id: "hero" },
            { label: "How It Works", id: "how-it-works" },
            { label: "Features", id: "features" },
            { label: "Contact Us", id: "contact" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className="text-white/90 hover:text-white text-sm font-medium font-[Poppins] transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          <Link to="/login">
            <motion.button
              whileHover={{ scale: 1.03 }}
              className="px-4 py-1.5 rounded-md border border-white text-white text-sm font-medium font-[Poppins] hover:bg-white/10 transition-colors"
            >
              Login
            </motion.button>
          </Link>
          <motion.button
            whileHover={{ scale: 1.03 }}
            onClick={() => scrollTo("contact")}
            className="px-4 py-1.5 rounded-md bg-white text-[#3aab4a] text-sm font-semibold font-[Poppins] hover:bg-white/90 transition-colors"
          >
            Partner With Us
          </motion.button>
        </div>
      </div>
    </motion.nav>
  );
};
