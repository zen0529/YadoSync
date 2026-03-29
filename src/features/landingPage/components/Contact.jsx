import { useState } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import welcomeImg from "@/features/landingPage/assets/welcome.jpg";

export const Contact = () => {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.target);

    try {
      await fetch("https://formspree.io/f/YOUR_FORM_ID", {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" className="bg-white py-20 px-6">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12">
        {/* Left Column */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="flex-1 space-y-6"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-700! font-[Poppins]">
            Get in Touch
          </h2>
          <p className="text-gray-600 text-base font-[Poppins] leading-relaxed mb-2!">
            Interested in listing your property? Have questions about how YadoBooking works? We'd love to hear from you.
          </p>

          <div className="rounded-xl aspect-video overflow-hidden">
            <img src={welcomeImg} alt="Welcome to Coron, Palawan" className="w-full h-full object-cover" />
          </div>
        </motion.div>

        {/* Right Column - Form */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex-1"
        >
          {submitted ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-10 text-center h-full flex flex-col items-center justify-center">
              <div className="w-14 h-14 bg-[#3aab4a] rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#1a4a5c] font-[Poppins] mb-2">Message Sent!</h3>
              <p className="text-gray-600 text-sm font-[Poppins]">
                Thank you for reaching out. We typically respond within 24 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  name="name"
                  type="text"
                  placeholder="Name"
                  required
                  className="w-full h-11 rounded-lg border border-gray-200 bg-white px-4 text-sm font-[Poppins] outline-none focus:ring-2 focus:ring-[#3aab4a]/30 focus:border-[#3aab4a] transition-all"
                />
              </div>
              <div>
                <input
                  name="email"
                  type="email"
                  placeholder="Email"
                  required
                  className="w-full h-11 rounded-lg border border-gray-200 bg-white px-4 text-sm font-[Poppins] outline-none focus:ring-2 focus:ring-[#3aab4a]/30 focus:border-[#3aab4a] transition-all"
                />
              </div>
              <div>
                <input
                  name="phone"
                  type="tel"
                  placeholder="Phone number"
                  className="w-full h-11 rounded-lg border border-gray-200 bg-white px-4 text-sm font-[Poppins] outline-none focus:ring-2 focus:ring-[#3aab4a]/30 focus:border-[#3aab4a] transition-all"
                />
              </div>
              <div>
                <input
                  name="property"
                  type="text"
                  placeholder="Property name"
                  className="w-full h-11 rounded-lg border border-gray-200 bg-white px-4 text-sm font-[Poppins] outline-none focus:ring-2 focus:ring-[#3aab4a]/30 focus:border-[#3aab4a] transition-all"
                />
              </div>
              <div>
                <textarea
                  name="message"
                  placeholder="Message"
                  rows={4}
                  required
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-[Poppins] outline-none focus:ring-2 focus:ring-[#3aab4a]/30 focus:border-[#3aab4a] transition-all resize-none"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.03 }}
                type="submit"
                disabled={submitting}
                className="w-full h-11 rounded-lg bg-[#3aab4a] text-white font-semibold text-sm font-[Poppins] hover:bg-[#339e42] transition-colors disabled:opacity-50"
              >
                {submitting ? "Sending..." : "Send Message"}
              </motion.button>

              <p className="text-gray-400 text-xs font-[Poppins] text-center">
                We typically respond within 24 hours.
              </p>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
};
