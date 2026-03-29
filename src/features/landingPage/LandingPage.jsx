import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { Problem } from "./components/Problem";
import { HowItWorks } from "./components/HowItWorks";
import { Features } from "./components/Features";
import { Locations } from "./components/Locations";
import { Commission } from "./components/Commission";
import { DevBanner } from "./components/DevBanner";
import { Contact } from "./components/Contact";
import { Footer } from "./components/Footer";

const LandingPage = () => {
  return (
    <div className="min-h-screen font-[Poppins]">
      <Navbar />
      <Hero />
      <Problem />
      <HowItWorks />
      <Features />
      <Locations />
      <Commission />
      <DevBanner />
      <Contact />
      <Footer />
    </div>
  );
};

export default LandingPage;
