import { motion } from "framer-motion";
import { EyeOff, Smartphone, AlertTriangle } from "lucide-react";

const PROBLEMS = [
  {
    icon: EyeOff,
    title: "Unlisted & Undiscovered",
    description: "Small resorts, inns, and villas have no presence on any online booking platform.",
  },
  {
    icon: Smartphone,
    title: "Manual & Outdated",
    description: "Owners rely on walk-ins, Facebook, and word of mouth instead of automated bookings.",
  },
  {
    icon: AlertTriangle,
    title: "Overbooking Risk",
    description: "Managing multiple platforms by hand leads to double bookings and lost trust.",
  },
];

export const Problem = () => {
  return (
    <section className="bg-[#f8f8f8] py-20 px-6">
      <div className="max-w-7xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-3xl md:text-4xl font-bold text-[#1a4a5c] font-[Poppins] mb-3"
        >
          The Problem
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-gray-600 mb-10! text-base md:text-lg font-[Poppins] mx-auto mb-12 text-center!"
        >
          Hundreds of accommodations across the Philippines are missing out on bookings every day.
        </motion.p>

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
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mx-auto mb-5">
                <problem.icon className="w-6 h-6 text-[#3aab4a]" />
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
