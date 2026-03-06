import { useState, useRef } from "react";
import { Upload, Music, Users, FileText, Plus, Tag } from "lucide-react";
import { motion } from "framer-motion";
import { TAGS } from "@/lib/mockData";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminAPI, songsAPI } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<"songs" | "requests" | "upload">("songs");
  const queryClient = useQueryClient();

  // admin data
  const { data: songsData, refetch: refetchSongs } = useQuery({
    queryKey: ['admin-songs'],
    queryFn: adminAPI.getSongs,
  });
  const { data: requestsData, refetch: refetchRequests } = useQuery({
    queryKey: ['admin-requests'],
    queryFn: adminAPI.getCustomRequests,
  });

  const songs = songsData?.songs || [];
  const requests = requestsData?.requests || [];

  // upload form state
  const [form, setForm] = useState({
    title: '',
    artist: '',
    description: '',
    price: '',
    tags: ''
  });
  const audioRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: (fd: FormData) => songsAPI.createSong(fd),
    onSuccess: () => {
      toast({ title: 'Song uploaded', description: 'The song was added successfully.' });
      refetchSongs();
      setForm({ title: '', artist: '', description: '', price: '', tags: '' });
      if (audioRef.current) audioRef.current.value = '';
      if (previewRef.current) previewRef.current.value = '';
    },
    onError: (err: any) => {
      toast({ title: 'Upload failed', description: err.response?.data?.message || 'Try again', variant: 'destructive' });
    }
  });

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('artist', form.artist);
    fd.append('description', form.description);
    fd.append('price', form.price);
    fd.append('tags', form.tags);
    if (audioRef.current?.files?.[0]) fd.append('audioFile', audioRef.current.files[0]);
    if (previewRef.current?.files?.[0]) fd.append('previewFile', previewRef.current.files[0]);
    uploadMutation.mutate(fd);
  };

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
            {songs.map((song: any) => (
              <div key={song._id} className="glass rounded-xl p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-foreground truncate">{song.title}</h3>
                  <p className="text-sm text-muted-foreground">{song.artist}</p>
                  <div className="flex gap-1.5 mt-1.5 flex-wrap">
                    {song.tags.map((tag: string) => (
                      <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">{tag}</span>
                    ))}
                  </div>
                </div>
                <span className="font-display font-bold text-foreground whitespace-nowrap">₹{song.price.toLocaleString("en-IN")}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${song.isSold ? "bg-destructive/20 text-destructive" : "bg-accent/20 text-accent"}`}>
                  {song.isSold ? "Sold" : "Available"}
                </span>
              </div>
            ))}
          </motion.div>
        )}

        {/* Custom Requests */}
        {activeTab === "requests" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {requests.map((req: any) => (
              <div key={req._id} className="glass rounded-xl p-5">
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
            onSubmit={handleUpload}
            className="glass rounded-2xl p-6 md:p-8 max-w-2xl space-y-5"
          >
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Song Title *</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Enter song title"
                className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Artist *</label>
              <input
                required
                value={form.artist}
                onChange={(e) => setForm({ ...form, artist: e.target.value })}
                placeholder="Artist name"
                className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Description</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Song description"
                className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Price (₹) *</label>
                <input
                  required
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="e.g. 2999"
                  className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Tags</label>
                <input
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="comma-separated tags"
                  className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Preview Audio</label>
                <input type="file" accept="audio/*" ref={previewRef} className="w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Full Audio</label>
                <input type="file" accept="audio/*" ref={audioRef} className="w-full" />
              </div>
            </div>
            <button
              type="submit"
              disabled={uploadMutation.isPending}
              className="w-full py-3 rounded-xl font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all glow-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadMutation.isPending ? (
                <div className="w-4 h-4 border border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {uploadMutation.isPending ? 'Uploading...' : 'Upload Song'}
            </button>
          </motion.form>
        )}      </div>
    </div>
  );
};

export default AdminDashboard;
