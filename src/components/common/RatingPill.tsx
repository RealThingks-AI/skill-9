import { cn } from "@/lib/utils";

interface RatingPillProps {
  rating: 'high' | 'medium' | 'low' | null;
  onRatingChange: (rating: 'high' | 'medium' | 'low') => void;
  disabled?: boolean;
  availableRatings?: ('high' | 'medium' | 'low')[];
  className?: string;
}

export const RatingPill = ({ rating, onRatingChange, disabled = false, availableRatings, className }: RatingPillProps) => {
  const ratingOptions = [
    { value: 'high' as const, label: 'High', color: 'bg-success text-success-foreground border-success' },
    { value: 'medium' as const, label: 'Medium', color: 'bg-warning text-warning-foreground border-warning' },
    { value: 'low' as const, label: 'Low', color: 'bg-destructive text-destructive-foreground border-destructive' }
  ];

  return (
    <div className={cn("flex gap-1", className)}>
      {ratingOptions.map((option) => {
        const isAvailable = !availableRatings || availableRatings.includes(option.value);
        const isCurrentRating = rating === option.value;
        const isClickable = isAvailable && !disabled;
        
        return (
          <button
            key={option.value}
            onClick={() => isClickable ? onRatingChange(option.value) : undefined}
            disabled={disabled || !isAvailable}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium transition-all duration-200",
              "border focus:outline-none focus:ring-2 focus:ring-primary/20",
              isCurrentRating
                ? option.color
                : isAvailable 
                  ? "bg-muted text-muted-foreground hover:bg-muted/80 hover:scale-105"
                  : "bg-muted/50 text-muted-foreground/50 cursor-not-allowed",
              disabled && "opacity-50 cursor-not-allowed hover:scale-100",
              !isAvailable && !isCurrentRating && "opacity-30"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};