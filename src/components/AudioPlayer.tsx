import { useState, useRef, useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { motion } from "framer-motion";

interface AudioPlayerProps {
  title: string;
  artist: string;
  coverImage: string;
  isPreview?: boolean;
  maxDuration?: number;
}

const AudioPlayer = ({ title, artist, coverImage, isPreview = true, maxDuration = 120 }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const duration = maxDuration;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      intervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercent = (currentTime / duration) * 100;

  return (
    <div className="glass-strong rounded-2xl p-5">
      <div className="flex items-center gap-4">
        {/* Cover */}
        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
          <img src={coverImage} alt={title} className="w-full h-full object-cover" />
        </div>

        {/* Info & Controls */}
        <div className="flex-1 min-w-0">
          <h4 className="font-display font-semibold text-foreground truncate">{title}</h4>
          <p className="text-sm text-muted-foreground">{artist}</p>

          {/* Progress */}
          <div className="mt-3 flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-10 text-right">
              {formatTime(currentTime)}
            </span>
            <div
              className="flex-1 h-1.5 rounded-full bg-muted cursor-pointer relative"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const percent = x / rect.width;
                setCurrentTime(Math.floor(percent * duration));
              }}
            >
              <motion.div
                className="h-full rounded-full bg-primary relative"
                style={{ width: `${progressPercent}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary glow-primary" />
              </motion.div>
            </div>
            <span className="text-xs text-muted-foreground w-10">
              {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 mt-4">
        <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
          <SkipBack className="w-5 h-5" />
        </button>
        <button
          onClick={togglePlay}
          className="w-12 h-12 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-all glow-primary"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 text-primary-foreground" />
          ) : (
            <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
          )}
        </button>
        <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
          <SkipForward className="w-5 h-5" />
        </button>
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors ml-4"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      {isPreview && (
        <p className="text-center text-xs text-muted-foreground mt-3">
          Preview limited to {Math.floor(maxDuration / 60)} minutes
        </p>
      )}
    </div>
  );
};

export default AudioPlayer;
