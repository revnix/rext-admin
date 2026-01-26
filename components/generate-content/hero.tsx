import { motion } from "framer-motion";

export function HeroSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center mb-10"
    >
      <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
        What are we <span className="text-primary">writing</span> today?
      </h1>
      <p className="text-lg text-slate-500 max-w-lg mx-auto leading-relaxed">
        Transform your keywords into high-quality content with our AI-powered
        generation engine.
      </p>
    </motion.div>
  );
}
