import { motion } from "framer-motion";
import resortImg from "@/features/landingPage/assets/resort.jpg";

export const Hero = () => {
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="hero" className="bg-white py-24 px-6">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
        {/* Left Column */}
        <div className="flex-1 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* <span className="inline-block bg-green-50 text-[#3aab4a] text-xs font-semibold font-[Poppins] px-4 py-1.5 rounded-full border border-green-200">
              Built for the Philippines
            </span> */}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-4xl md:text-5xl font-extrabold text-gray-700! leading-tight font-[Poppins]"
          >
            Manage Every Stay, Everywhere.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-gray-600 text-base md:text-lg max-w-lg font-[Poppins] leading-relaxed"
          >
            YadoManagement helps accommodation owners get listed and booked on major travel platforms — automatically and in real time.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="flex flex-wrap gap-3 mt-10"
          >
            <motion.button
              whileHover={{ scale: 1.03 }}
              onClick={() => scrollTo("contact")}
              className="px-6 py-3 rounded-lg bg-[#3aab4a] text-white font-semibold text-sm font-[Poppins] hover:bg-[#339e42] transition-colors"
            >
              Partner With Us
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              onClick={() => scrollTo("how-it-works")}
              className="px-6 py-3 rounded-lg border-2 border-[#3aab4a] text-[#3aab4a] font-semibold text-sm font-[Poppins] hover:bg-green-50 transition-colors"
            >
              Learn More
            </motion.button>
          </motion.div>

          {/* <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="flex flex-wrap gap-2 pt-2"
          >
            {["Booking.com", "Agoda", "Airbnb", "Traveloka"].map((platform) => (
              <span
                key={platform}
                className="bg-gray-100 text-gray-600 text-xs font-medium font-[Poppins] px-3 py-1 rounded-full"
              >
                {platform}
              </span>
            ))}
          </motion.div> */}
        </div>

        {/* Right Column */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex-1 w-full max-w-xl"
        >
          {/* TODO: Replace with actual photo */}
          <img src={resortImg} alt="Resort exterior" className="rounded-2xl aspect-video object-cover w-full" />
        </motion.div>
      </div>
    </section>
  );
};
