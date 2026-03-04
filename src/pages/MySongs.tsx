import { Download, Play, Music } from "lucide-react";
import { motion } from "framer-motion";
import AudioPlayer from "@/components/AudioPlayer";
import { mockPurchasedSongs } from "@/lib/mockData";

const MySongs = () => {
  return (
    <div className="min-h-screen pt-20 pb-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-display text-3xl md:text-4xl font-bold text-gradient">
            My Songs
          </h1>
          <p className="text-muted-foreground mt-2">
            Your purchased songs — download anytime.
          </p>
        </motion.div>

        {mockPurchasedSongs.length === 0 ? (
          <div className="text-center py-20">
            <Music className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">No purchased songs yet.</p>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {mockPurchasedSongs.map((song, i) => (
              <motion.div
                key={song.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="glass rounded-2xl p-6"
              >
                <div className="flex items-start gap-4 mb-4">
                  <img
                    src={song.coverImage}
                    alt={song.title}
                    className="w-20 h-20 rounded-xl object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-display font-semibold text-lg text-foreground">
                      {song.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{song.artist}</p>
                    <div className="flex gap-2 mt-2">
                      {song.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/20"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button className="px-4 py-2 rounded-lg text-sm font-medium bg-accent text-accent-foreground hover:bg-accent/90 transition-all glow-accent flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>

                <AudioPlayer
                  title={song.title}
                  artist={song.artist}
                  coverImage={song.coverImage}
                  isPreview={false}
                  maxDuration={song.duration}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MySongs;
