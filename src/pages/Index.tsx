import { useState, useMemo } from "react";
import { Search, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import SongCard from "@/components/SongCard";
import TagFilter from "@/components/TagFilter";
import { songsAPI, Song } from "@/lib/api";
import heroBg from "@/assets/hero-bg.jpg";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { t } = useTranslation();

  // Fetch songs from API
  const { data: songsData, isLoading, error } = useQuery({
    queryKey: ['songs', searchQuery, selectedTags],
    queryFn: () => songsAPI.getSongs({
      search: searchQuery || undefined,
      tags: selectedTags.length > 0 ? selectedTags.join(',') : undefined
    }),
  });

  const songs = songsData?.songs || [];

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="min-h-screen pt-1">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        </div>

        <div className="relative container mx-auto px-4 py-20 md:py-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass neon-border text-sm text-primary mb-6">
              <Sparkles className="w-4 h-4" />
              AI-Powered Custom Songs
            </div>
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl p-4 font-bold text-gradient leading-tight">
              {t('home.welcome')}
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('home.subtitle')}
            </p>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-10 max-w-xl mx-auto"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder={t('marketplace.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl glass-strong text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Marketplace */}
      <section className="container mx-auto px-4 pb-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <TagFilter selectedTags={selectedTags} onTagToggle={handleTagToggle} />
        </motion.div>

        {isLoading ? (
          <div className="text-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t('common.loading')}</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">{t('marketplace.noSongs')}</p>
          </div>
        ) : songs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">{t('marketplace.noSongs')}</p>
          </div>
        ) : (
          <div className="space-y-3 max-w-3xl">
            {songs.map((song: Song, i: number) => (
              <SongCard key={song._id} song={song} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Index;
