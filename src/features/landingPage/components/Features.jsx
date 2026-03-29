import { motion } from "framer-motion";
import { Globe, RefreshCw, BellRing, ShieldCheck, Coins, MapPin } from "lucide-react";

const FEATURES = [
  {
    icon: Globe,
    title: "Multi-Platform Listing",
    description: "We list your property across all major OTA platforms in the Philippines and Southeast Asia.",
  },
  {
    icon: RefreshCw,
    title: "Real-Time Availability Sync",
    description: "Dates block automatically across all platforms the moment a booking is confirmed.",
  },
  {
    icon: BellRing,
    title: "Instant Notifications",
    description: "SMS and email alerts for every booking, modification, or cancellation.",
  },
  {
    icon: ShieldCheck,
    title: "No Overbooking",
    description: "Our system eliminates double bookings by syncing all platforms simultaneously.",
  },
  {
    icon: Coins,
    title: "Commission-Based Only",
    description: "No upfront fees. We earn a small percentage only when you get a booking.",
  },
  {
    icon: MapPin,
    title: "Local Focus",
    description: "Built specifically for the Philippine market with local support and knowledge.",
  },
];

export const Features = () => {
  return (
    <section id="features" className="bg-[#f8f8f8] py-20 px-6">
      <div className="max-w-7xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-3xl md:text-4xl font-bold text-[#1a4a5c] font-[Poppins] mb-3"
        >
          Everything Managed For You
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow text-left"
            >
              <div className="w-11 h-11 bg-green-50 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="w-5 h-5 text-[#3aab4a]" />
              </div>
              <h3 className="text-base font-bold text-[#1a4a5c] font-[Poppins] mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm font-[Poppins] leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
