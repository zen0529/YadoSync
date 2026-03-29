import { motion } from "framer-motion";
import { Check } from "lucide-react";

const PERKS = [
  { label: "No setup fee", description: "Get started at zero cost" },
  { label: "No monthly subscription", description: "No recurring charges ever" },
  { label: "Pay only per booking", description: "We earn only when you earn" },
];

export const Commission = () => {
  return (
    <section className="bg-[#f8f8f8] py-20 px-6">
      <div className="max-w-7xl mx-auto flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-2xl shadow-md max-w-2xl w-full overflow-hidden"
        >
          {/* Top content */}
          <div className="p-10 text-center flex flex-col items-center gap-4">
            {/* <span className="inline-block bg-green-50 text-[#3aab4a] text-xs font-semibold font-[Poppins] px-4 py-1.5 rounded-full border border-green-200 mb-5">
              Commission-Based Only
            </span> */}
            <h2 className="text-2xl md:text-3xl font-bold text-[#1a4a5c]! font-[Poppins] mb-3">
              Simple, Transparent Pricing
            </h2>
            <p className="text-gray-600 text-sm font-[Poppins] leading-relaxed max-w-md mx-auto text-center">
              We earn a small agreed percentage from each confirmed booking we generate for you. If you don't earn, we don't earn. No setup fees, no subscriptions, no hidden charges.
            </p>
          </div>

          {/* Highlight row */}
          <div className="bg-[#f0faf1] border-t border-green-100 px-10 py-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {PERKS.map((perk) => (
                <div key={perk.label} className="flex flex-col items-center gap-1.5 text-center">
                  <div className="w-8 h-8 bg-[#3aab4a] rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-[#1a4a5c] font-[Poppins]">{perk.label}</span>
                  <span className="text-xs text-gray-500 font-[Poppins]">{perk.description}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
