import { TAGS } from "@/lib/mockData";
import { motion } from "framer-motion";

interface TagFilterProps {
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
}

const TagFilter = ({ selectedTags, onTagToggle }: TagFilterProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => selectedTags.length > 0 && selectedTags.forEach(onTagToggle)}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
          selectedTags.length === 0
            ? "bg-primary text-primary-foreground glow-primary"
            : "bg-secondary text-muted-foreground hover:text-foreground"
        }`}
      >
        All
      </button>
      {TAGS.map((tag) => {
        const isActive = selectedTags.includes(tag);
        return (
          <motion.button
            key={tag}
            whileTap={{ scale: 0.95 }}
            onClick={() => onTagToggle(tag)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              isActive
                ? "bg-primary/20 text-primary neon-border"
                : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
            }`}
          >
            {tag}
          </motion.button>
        );
      })}
    </div>
  );
};

export default TagFilter;
