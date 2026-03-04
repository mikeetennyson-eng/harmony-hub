import { useState } from "react";
import { Sparkles, Send, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { mockCustomRequests } from "@/lib/mockData";

const CustomRequest = () => {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    occasion: "",
    names: "",
    brandName: "",
    tone: "",
    language: "",
    description: "",
    budget: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const tones = ["Romantic", "Hype", "Emotional", "Devotional", "Corporate"];
  const languages = ["English", "Hindi", "Tamil", "Telugu", "Punjabi", "Bengali"];

  return (
    <div className="min-h-screen pt-20 pb-20">
      <div className="container mx-auto px-4 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <h1 className="font-display text-3xl md:text-4xl font-bold text-gradient">
              Custom Song Request
            </h1>
          </div>
          <p className="text-muted-foreground mb-8">
            Tell us your story and we'll craft a unique AI-powered song just for you.
          </p>
        </motion.div>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-8 text-center"
          >
            <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="font-display text-2xl font-bold text-foreground">
              Request Submitted!
            </h2>
            <p className="text-muted-foreground mt-2">
              We'll start working on your custom song. Track progress below.
            </p>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onSubmit={handleSubmit}
            className="glass rounded-2xl p-6 md:p-8 space-y-5"
          >
            {/* Occasion */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Occasion *</label>
              <input
                required
                value={form.occasion}
                onChange={(e) => setForm({ ...form, occasion: e.target.value })}
                placeholder="e.g. Wedding, Birthday, Brand Launch"
                className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>

            {/* Names */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Names Involved *</label>
              <input
                required
                value={form.names}
                onChange={(e) => setForm({ ...form, names: e.target.value })}
                placeholder="e.g. John & Sarah"
                className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>

            {/* Brand Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Brand Name (optional)</label>
              <input
                value={form.brandName}
                onChange={(e) => setForm({ ...form, brandName: e.target.value })}
                placeholder="e.g. Your Company Name"
                className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>

            {/* Tone & Language */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Tone *</label>
                <select
                  required
                  value={form.tone}
                  onChange={(e) => setForm({ ...form, tone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                >
                  <option value="">Select tone</option>
                  {tones.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Language *</label>
                <select
                  required
                  value={form.language}
                  onChange={(e) => setForm({ ...form, language: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                >
                  <option value="">Select language</option>
                  {languages.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Description *</label>
              <textarea
                required
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Tell us your story, special memories, or specific lyrics you'd like..."
                className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
              />
            </div>

            {/* Budget */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Budget (₹) *</label>
              <input
                required
                type="number"
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
                placeholder="e.g. 5000"
                className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all glow-primary flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Submit Request
            </button>
          </motion.form>
        )}

        {/* Request Status */}
        {mockCustomRequests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12"
          >
            <h2 className="font-display text-xl font-bold text-foreground mb-4">
              Your Requests
            </h2>
            <div className="space-y-4">
              {mockCustomRequests.map((req) => (
                <div key={req.id} className="glass rounded-xl p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-display font-semibold text-foreground">
                        {req.occasion} — {req.names}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {req.tone} · {req.language} · ₹{req.budget.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        req.status === "completed"
                          ? "bg-accent/20 text-accent"
                          : req.status === "in_progress"
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {req.status === "in_progress" ? "In Progress" : req.status === "completed" ? "Completed" : "Pending"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CustomRequest;
