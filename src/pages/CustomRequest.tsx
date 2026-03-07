import { useState } from "react";
import { Sparkles, Send, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { customRequestsAPI } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

const CustomRequest = () => {
  const { t } = useTranslation();
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

  // Fetch user's custom requests
  const { data: requestsData, refetch } = useQuery({
    queryKey: ['custom-requests'],
    queryFn: customRequestsAPI.getMyRequests,
  });

  const requests = requestsData?.requests || [];

  // Create request mutation
  const createRequestMutation = useMutation({
    mutationFn: (data: {
      occasion: string;
      names: string;
      brandName?: string;
      tone: string;
      language: string;
      description: string;
      budget: number;
    }) => customRequestsAPI.createRequest(data),
    onSuccess: () => {
      toast({
        title: t("customRequest.submitSuccess"),
        description: t("customRequest.submitSuccessDesc"),
      });
      setSubmitted(true);
      refetch();
      // Reset form
      setForm({
        occasion: "",
        names: "",
        brandName: "",
        tone: "",
        language: "",
        description: "",
        budget: "",
      });
    },
    onError: (error: any) => {
      console.error('Custom request error:', error.response?.data);

      let errorMessage = t("customRequest.submitError");

      if (error.response?.data?.errors) {
        // Handle express-validator errors
        const validationErrors = error.response.data.errors;
        if (Array.isArray(validationErrors) && validationErrors.length > 0) {
          errorMessage = validationErrors.map((err: any) => err.msg || err.message).join(', ');
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast({
        title: t("customRequest.submitFailed"),
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic frontend validation
    if (!form.occasion.trim() || form.occasion.trim().length < 2) {
      toast({
        title: t("customRequest.validationError"),
        description: t("customRequest.occasionError"),
        variant: "destructive",
      });
      return;
    }

    if (!form.names.trim()) {
      toast({
        title: t("customRequest.validationError"),
        description: t("customRequest.namesError"),
        variant: "destructive",
      });
      return;
    }

    if (!form.tone) {
      toast({
        title: t("customRequest.validationError"),
        description: t("customRequest.toneError"),
        variant: "destructive",
      });
      return;
    }

    if (!form.language) {
      toast({
        title: t("customRequest.validationError"),
        description: t("customRequest.languageError"),
        variant: "destructive",
      });
      return;
    }

    if (!form.description.trim() || form.description.trim().length < 10) {
      toast({
        title: t("customRequest.validationError"),
        description: t("customRequest.descriptionError"),
        variant: "destructive",
      });
      return;
    }

    const budgetNum = parseInt(form.budget);
    if (isNaN(budgetNum) || budgetNum < 0) {
      toast({
        title: t("customRequest.validationError"),
        description: t("customRequest.budgetError"),
        variant: "destructive",
      });
      return;
    }

    const requestData: any = {
      occasion: form.occasion.trim(),
      names: form.names.trim(),
      tone: form.tone.toLowerCase(),
      language: form.language.toLowerCase(),
      description: form.description.trim(),
      budget: budgetNum,
    };

    // Only include brandName if it's not empty
    if (form.brandName.trim()) {
      requestData.brandName = form.brandName.trim();
    }

    createRequestMutation.mutate(requestData);
  };

  const tones = ["Romantic", "Hype", "Emotional", "Devotional", "Corporate", "Celebratory"];
  const languages = ["English", "Hindi", "Tamil", "Telugu", "Punjabi", "Bengali", "Marathi", "Gujarati"];

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
              {t("customRequest.title")}
            </h1>
          </div>
          <p className="text-muted-foreground mb-8">
            {t("customRequest.description")}
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
              {t("customRequest.submitted")}
            </h2>
            <p className="text-muted-foreground mt-2">
              {t("customRequest.submittedDesc")}
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
              <label className="block text-sm font-medium text-foreground mb-2">{t("customRequest.occasion")} *</label>
              <input
                required
                value={form.occasion}
                onChange={(e) => setForm({ ...form, occasion: e.target.value })}
                placeholder={t("customRequest.occasionPlaceholder")}
                className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>

            {/* Names */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t("customRequest.names")} *</label>
              <input
                required
                value={form.names}
                onChange={(e) => setForm({ ...form, names: e.target.value })}
                placeholder={t("customRequest.namesPlaceholder")}
                className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>

            {/* Brand Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t("customRequest.brandName")}</label>
              <input
                value={form.brandName}
                onChange={(e) => setForm({ ...form, brandName: e.target.value })}
                placeholder={t("customRequest.brandNamePlaceholder")}
                className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>

            {/* Tone & Language */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{t("customRequest.tone")} *</label>
                <select
                  required
                  value={form.tone}
                  onChange={(e) => setForm({ ...form, tone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                >
                  <option value="">{t("customRequest.selectTone")}</option>
                  {tones.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{t("customRequest.language")} *</label>
                <select
                  required
                  value={form.language}
                  onChange={(e) => setForm({ ...form, language: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                >
                  <option value="">{t("customRequest.selectLanguage")}</option>
                  {languages.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t("customRequest.description")} *</label>
              <textarea
                required
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={t("customRequest.descriptionPlaceholder")}
                className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
              />
            </div>

            {/* Budget */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t("customRequest.budget")} (₹) *</label>
              <input
                required
                type="number"
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
                placeholder={t("customRequest.budgetPlaceholder")}
                className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={createRequestMutation.isPending}
              className="w-full py-3 rounded-xl font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all glow-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createRequestMutation.isPending ? (
                <div className="w-4 h-4 border border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {createRequestMutation.isPending ? t("customRequest.submitting") : t("customRequest.submit")}
            </button>
          </motion.form>
        )}

        {/* Request Status */}
        {requests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12"
          >
            <h2 className="font-display text-xl font-bold text-foreground mb-4">
              {t("customRequest.yourRequests")}
            </h2>
            <div className="space-y-4">
              {requests.map((req: any) => (
                <div key={req._id} className="glass rounded-xl p-5">
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
                      {req.status === "in_progress" ? t("customRequest.inProgress") : req.status === "completed" ? t("customRequest.completed") : t("customRequest.pending")}
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
