import { useState } from "react";
import { Upload, Music, Users, FileText, Plus, Tag } from "lucide-react";
import { motion } from "framer-motion";
import { mockSongs, mockCustomRequests, TAGS } from "@/lib/mockData";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<"songs" | "requests" | "upload">("songs");

  const tabs = [
    { id: "songs" as const, label: "Songs", icon: Music },
    { id: "requests" as const, label: "Custom Requests", icon: FileText },
    { id: "upload" as const, label: "Upload Song", icon: Upload },
  ];

  return (
    <div className="min-h-screen pt-20 pb-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-3xl md:text-4xl font-bold text-gradient mb-2">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mb-8">Manage songs, requests, and uploads.</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-primary/20 text-primary neon-border"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Songs list */}
        {activeTab === "songs" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {mockSongs.map((song) => (
              <div key={song.id} className="glass rounded-xl p-4 flex items-center gap-4">
                <img src={song.coverImage} alt={song.title} className="w-14 h-14 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-foreground truncate">{song.title}</h3>
                  <div className="flex gap-1.5 mt-1">
                    {song.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">{tag}</span>
                    ))}
                  </div>
                </div>
                <span className="font-display font-bold text-foreground">₹{song.price.toLocaleString("en-IN")}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${song.isSold ? "bg-destructive/20 text-destructive" : "bg-accent/20 text-accent"}`}>
                  {song.isSold ? "Sold" : "Available"}
                </span>
              </div>
            ))}
          </motion.div>
        )}

        {/* Custom Requests */}
        {activeTab === "requests" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {mockCustomRequests.map((req) => (
              <div key={req.id} className="glass rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-display font-semibold text-foreground">{req.occasion} — {req.names}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{req.tone} · {req.language} · ₹{req.budget.toLocaleString("en-IN")}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    req.status === "completed" ? "bg-accent/20 text-accent" : req.status === "in_progress" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                  }`}>
                    {req.status === "in_progress" ? "In Progress" : req.status === "completed" ? "Completed" : "Pending"}
                  </span>
                </div>
                <p className="text-sm text-secondary-foreground">{req.description}</p>
                <div className="flex gap-2 mt-4">
                  <button className="px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center gap-2">
                    <Upload className="w-4 h-4" /> Upload Song
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Upload Form */}
        {activeTab === "upload" && (
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={(e) => e.preventDefault()}
            className="glass rounded-2xl p-6 md:p-8 max-w-2xl space-y-5"
          >
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Song Title *</label>
              <input placeholder="Enter song title" className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Description</label>
              <textarea rows={3} placeholder="Song description" className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Price (₹) *</label>
                <input type="number" placeholder="e.g. 2999" className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Tags</label>
                <select className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all">
                  <option value="">Select tags</option>
                  {TAGS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Cover Image</label>
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <Plus className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Click to upload cover image</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Preview Audio</label>
                <div className="border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <Music className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Upload preview (120s max)</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Full Audio</label>
                <div className="border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <Music className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Upload full song</p>
                </div>
              </div>
            </div>
            <button type="submit" className="w-full py-3 rounded-xl font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all glow-primary flex items-center justify-center gap-2">
              <Upload className="w-4 h-4" /> Upload Song
            </button>
          </motion.form>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
