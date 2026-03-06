import { useRef } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Lock, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Song, songsAPI, purchasesAPI } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface SongCardProps {
  song: Song;
  index: number;
}

const SongCard = ({ song, index }: SongCardProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Check if song is purchased
  const { data: purchaseStatus } = useQuery({
    queryKey: ['purchase-status', song._id],
    queryFn: () => songsAPI.checkPurchaseStatus(song._id),
    enabled: !!user,
  });

  // Purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: () => purchasesAPI.createPurchase({
      songIds: [song._id],
      paymentMethod: 'card'
    }),
    onSuccess: () => {
      toast({
        title: "Purchase successful!",
        description: `${song.title} has been added to your library.`,
      });
      queryClient.invalidateQueries({ queryKey: ['purchase-status', song._id] });
      queryClient.invalidateQueries({ queryKey: ['purchased-songs'] });
      queryClient.invalidateQueries({ queryKey: ['songs'] });
    },
    onError: (error: any) => {
      toast({
        title: "Purchase failed",
        description: error.response?.data?.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const isPurchased = purchaseStatus?.purchased || false;
  const isPreviewMode = !user || !isPurchased;

  const formatPrice = (price: number) => {
    return `₹${(price).toLocaleString("en-IN")}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Link to={`/song/${song._id}`} className="block group">
        <div className="glass rounded-xl px-5 py-4 transition-all duration-300 hover:glow-primary hover:border-primary/40 flex items-center justify-between gap-4">
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-display font-semibold text-foreground truncate">
                {song.title}
              </h3>
              {isPreviewMode && (
                <Lock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{song.artist}</p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1 mt-2">
              {song.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Price & Buy */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="font-display font-bold text-foreground whitespace-nowrap">
              {formatPrice(song.price)}
            </span>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!user) {
                  toast({
                    title: "Please login",
                    description: "You need to be logged in to purchase songs.",
                    variant: "destructive",
                  });
                  return;
                }
                if (isPurchased) return;
                purchaseMutation.mutate();
              }}
              disabled={purchaseMutation.isPending || isPurchased}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center gap-1.5 glow-primary disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {purchaseMutation.isPending ? (
                <div className="w-3.5 h-3.5 border border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : isPurchased ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Owned
                </>
              ) : (
                <>
                  <ShoppingCart className="w-3.5 h-3.5" />
                  Buy
                </>
              )}
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default SongCard;
