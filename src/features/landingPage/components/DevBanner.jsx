import { motion } from "framer-motion";

export const DevBanner = () => {
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="bg-[#3aab4a] py-20 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="space-y-5 flex flex-col items-center"
        >
          <span className="inline-block bg-white/20 text-white text-xs font-semibold font-[Poppins] px-4 py-1.5 rounded-full">
            Currently in Development
          </span>

          <h2 className="text-3xl md:text-4xl font-bold text-white font-[Poppins]">
            We're building something great.
          </h2>

          <p className="text-white/90 text-base font-[Poppins] leading-relaxed max-w-xl mx-auto">
            YadoManagement is currently in active development. We are onboarding our first properties. If you'd like to be among the first accommodations we manage, reach out to us today.
          </p>

          <motion.button
            whileHover={{ scale: 1.03 }}
            onClick={() => scrollTo("contact")}
            className="px-6 py-3 mt-10 rounded-lg border-2 border-white text-white font-semibold text-sm font-[Poppins] hover:bg-white/10 transition-colors"
          >
            Get Early Access
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};
