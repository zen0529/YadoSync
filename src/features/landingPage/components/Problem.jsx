import { motion } from "framer-motion";
import unlistedImg from "@/features/landingPage/assets/problems/unlisted.png";
import manualImg from "@/features/landingPage/assets/problems/manual.png";
import riskImg from "@/features/landingPage/assets/problems/risk.png";

const PROBLEMS = [
  {
    image: unlistedImg,
    title: "Unlisted & Undiscovered",
    description: "Small resorts, inns, and villas have no presence on any online booking platform.",
  },
  {
    image: manualImg,
    title: "Manual & Outdated",
    description: "Owners rely on walk-ins, Facebook, and word of mouth instead of automated bookings.",
  },
  {
    image: riskImg,
    title: "Overbooking Risk",
    description: "Managing multiple platforms by hand leads to double bookings and lost trust.",
  },
];

export const Problem = () => {
  return (
    <section className="bg-[#f8f8f8] pb-20 pt-20 px-6">
      <div className="max-w-7xl mx-auto text-center">
        <div className="flex flex-col items-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-3xl md:text-4xl font-bold text-[#1a4a5c] font-[Poppins] mb-8!"
          >
            Why Accommodations Are Losing Bookings
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-gray-600 text-base md:text-lg font-[Poppins] max-w-2xl text-center"
          >
            Hundreds of resorts, inns, and villas are missing out on bookings every day — not because they lack quality, but because they lack the right tools.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PROBLEMS.map((problem, i) => (
            <motion.div
              key={problem.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-40 h-40 flex items-center justify-center mx-auto mb-5">
                <img src={problem.image} alt={problem.title} className="w-40 h-40 object-contain" />
              </div>
              <h3 className="text-lg font-bold text-[#1a4a5c] font-[Poppins] mb-2">{problem.title}</h3>
              <p className="text-gray-600 text-sm font-[Poppins] leading-relaxed">{problem.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
