import { motion } from "framer-motion";
import cebuImg from "@/features/landingPage/assets/cebu.jpg";
import palawanImg from "@/features/landingPage/assets/palawan.jpg";
import siargaoImg from "@/features/landingPage/assets/siargao.jpg";
import boracayImg from "@/features/landingPage/assets/boracay.jpg";

const LOCATIONS = ["Cebu", "Palawan", "Siargao", "Boracay", "Batangas"];
const PHOTOS = [
  { label: "Cebu", src: cebuImg },
  { label: "Palawan", src: palawanImg },
  { label: "Siargao", src: siargaoImg },
  { label: "Boracay", src: boracayImg },
];

export const Locations = () => {
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="bg-white py-20 px-6">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
        {/* Left Column */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="flex-1 space-y-6"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-700! font-[Poppins]">
            Serving Accommodations Across the Philippines
          </h2>
          <p className="text-gray-600 text-base font-[Poppins] mb-5!">
            Starting with the country's most-visited destinations
          </p>

          <div className="flex flex-wrap gap-2">
            {LOCATIONS.map((loc) => (
              <span
                key={loc}
                className="bg-green-50 text-[#3aab4a] text-sm font-semibold font-[Poppins] px-4 py-1.5 rounded-full border border-green-200"
              >
                {loc}
              </span>
            ))}
          </div>

          <p className="text-gray-600 text-sm font-[Poppins] leading-relaxed italic">
            Whether you run a beachfront resort, a mountain villa, or a cozy inn — if you're not online, you're missing bookings. We can change that.
          </p>

          <motion.button
            whileHover={{ scale: 1.03 }}
            onClick={() => scrollTo("contact")}
            className="px-6 py-3 mt-10 rounded-lg bg-[#3aab4a] text-white font-semibold text-sm font-[Poppins] hover:bg-[#339e42] transition-colors"
          >
            List Your Property
          </motion.button>
        </motion.div>

        {/* Right Column - 2x2 grid */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex-1 w-full"
        >
          <div className="grid grid-cols-2 gap-4">
            {PHOTOS.map((photo) => (
              <div key={photo.label} className="rounded-xl aspect-square overflow-hidden">
                <img src={photo.src} alt={photo.label} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
