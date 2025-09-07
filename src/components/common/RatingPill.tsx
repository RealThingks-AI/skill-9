import { cn } from "@/lib/utils";

interface RatingPillProps {
  rating: 'high' | 'medium' | 'low' | null;
  onRatingChange: (rating: 'high' | 'medium' | 'low') => void;
  disabled?: boolean;
  className?: string;
}

export const RatingPill = ({ rating, onRatingChange, disabled = false, className }: RatingPillProps) => {
  const ratingOptions = [
    { value: 'high' as const, label: 'High', color: 'bg-emerald-500 text-white' },
    { value: 'medium' as const, label: 'Medium', color: 'bg-amber-500 text-white' },
    { value: 'low' as const, label: 'Low', color: 'bg-slate-500 text-white' }
  ];

  return (
    <div className={cn("flex gap-1", className)}>
      {ratingOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => onRatingChange(option.value)}
          disabled={disabled}
          className={cn(
            "px-3 py-1 rounded-full text-xs font-medium transition-all duration-200",
            "border hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/20",
            rating === option.value
              ? option.color
              : "bg-muted text-muted-foreground hover:bg-muted/80",
            disabled && "opacity-50 cursor-not-allowed hover:scale-100"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};