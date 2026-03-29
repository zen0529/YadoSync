import { motion } from "framer-motion";
import happyImg from "@/features/landingPage/assets/happy.jpg";
import { ListPlus, RefreshCw, Bell } from "lucide-react";

const STEPS = [
  {
    icon: ListPlus,
    title: "We List Your Property",
    description: "We register your accommodation on Booking.com, Agoda, Airbnb, Traveloka and more on your behalf.",
  },
  {
    icon: RefreshCw,
    title: "We Sync in Real Time",
    description: "When a booking comes in from any platform, we block those dates everywhere else instantly — no overbooking.",
  },
  {
    icon: Bell,
    title: "You Get Notified",
    description: "You receive an SMS and email the moment a booking is confirmed. No extra tools needed.",
  },
];

export const HowItWorks = () => {
  return (
    <section id="how-it-works" className="bg-white py-20 px-6">
      <div className="max-w-7xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-3xl md:text-4xl mb-5! font-bold text-gray-700! font-[Poppins] mb-3"
        >
          How YadoBooking Works
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-gray-600 mb-10! text-base md:text-lg font-[Poppins] mx-auto mb-14 text-center!"
        >
          We handle everything from listing to booking sync — so you don't have to.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting line (desktop only) */}
          <div className="hidden md:block absolute top-16 left-1/6 right-1/6 h-0.5 bg-green-200" />

          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.15 }}
              className="relative flex flex-col items-center"
            >
              <div className="w-14 h-14 bg-[#3aab4a] rounded-full flex items-center justify-center mb-5 relative z-10">
                <step.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-bold text-[#3aab4a] font-[Poppins] mb-2 uppercase tracking-wider">
                Step {i + 1}
              </span>
              <h3 className="text-lg font-bold text-[#1a4a5c] font-[Poppins] mb-2">{step.title}</h3>
              <p className="text-gray-600 text-sm font-[Poppins] leading-relaxed max-w-xs">{step.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="text-gray-500 italic text-sm font-[Poppins] mt-12"
        >
          We handle everything. You just welcome your guests.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-12 rounded-2xl h-[300px] overflow-hidden"
        >
          <img src={happyImg} alt="Happy accommodation owner" className="w-full h-full object-cover object-top" />
        </motion.div>
      </div>
    </section>
  );
};
