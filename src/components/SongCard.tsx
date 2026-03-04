import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Play, Pause, ShoppingCart, Clock } from "lucide-react";
import { motion } from "framer-motion";
import type { Song } from "@/lib/mockData";

interface SongCardProps {
  song: Song;
  index: number;
}

const SongCard = ({ song, index }: SongCardProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const togglePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.5;
        });
      }, 100);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatPrice = (price: number) => {
    return `₹${(price).toLocaleString("en-IN")}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
    >
      <Link to={`/song/${song.id}`} className="block group">
        <div className="glass rounded-xl overflow-hidden transition-all duration-500 hover:glow-primary hover:border-primary/40">
          {/* Cover */}
          <div className="relative aspect-square overflow-hidden">
            <img
              src={song.coverImage}
              alt={song.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />

            {/* Play button */}
            <button
              onClick={togglePlay}
              className="absolute bottom-3 right-3 w-12 h-12 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 hover:scale-110 glow-primary"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-primary-foreground" />
              ) : (
                <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
              )}
            </button>

            {/* Duration */}
            <div className="absolute top-3 right-3 px-2 py-1 rounded-md glass text-xs text-foreground/80 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(song.duration)}
            </div>

            {/* Progress bar */}
            {isPlaying && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/30">
                <motion.div
                  className="h-full bg-primary"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-4">
            <h3 className="font-display font-semibold text-foreground truncate">
              {song.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">{song.artist}</p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {song.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/20"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Price & Buy */}
            <div className="flex items-center justify-between mt-4">
              <span className="font-display font-bold text-lg text-foreground">
                {formatPrice(song.price)}
              </span>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center gap-1.5 glow-primary"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                Buy
              </button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default SongCard;
