import { motion } from "framer-motion";
import globalImg from "@/features/landingPage/assets/features/global.png";
import syncImg from "@/features/landingPage/assets/features/sync.png";
import notificationsImg from "@/features/landingPage/assets/features/notifications.png";
import overbookImg from "@/features/landingPage/assets/features/overbook.png";
import commissionImg from "@/features/landingPage/assets/features/commission.png";

const FEATURES = [
  {
    image: globalImg,
    title: "Multi-Platform Listing",
    description:
      "We list your property across all major OTA platforms to maximize your visibility and reach.",
  },
  {
    image: syncImg,
    title: "Real-Time Availability Sync",
    description:
      "Dates block automatically across all platforms the moment a booking is confirmed.",
  },
  {
    image: notificationsImg,
    title: "Instant Notifications",
    description:
      "SMS and email alerts for every booking, modification, or cancellation.",
  },
  {
    image: overbookImg,
    title: "No Overbooking",
    description:
      "Our system eliminates double bookings by syncing all platforms simultaneously.",
  },
  {
    image: commissionImg,
    title: "Commission-Based Only",
    description:
      "No upfront fees. We earn a small percentage only when you get a booking.",
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

        {/* Top row — 3 items */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {FEATURES.slice(0, 3).map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-40 h-40 flex items-center justify-center mx-auto mb-5">
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="w-40 h-40 object-contain"
                />
              </div>
              <h3 className="text-lg font-bold text-[#1a4a5c] font-[Poppins] mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm font-[Poppins] leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Bottom row — 2 items centered */}
        <div className="flex justify-center gap-6 mt-6">
          {FEATURES.slice(3).map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: (i + 3) * 0.08 }}
              className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow w-full md:w-[calc(33.333%-8px)]"
            >
              <div className="w-40 h-40 flex items-center justify-center mx-auto mb-5">
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="w-40 h-40 object-contain"
                />
              </div>
              <h3 className="text-lg font-bold text-[#1a4a5c] font-[Poppins] mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm font-[Poppins] leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
