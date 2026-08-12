import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import musicNote from "../../assets/music-note.webp";

import { cn } from "@/lib/utils";

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-7 w-full overflow-hidden rounded-full bg-celestialLightGray border",
      className,
    )}
    {...props}
  >
    <div
      className="h-full w-full bg-celestialPrimary transition-all rounded-lg"
      style={{ width: `${value}%` }}
    ></div>
    <div
      className="absolute top-0 h-full w-6 flex items-center justify-center text-white transition-transform"
      style={{
        transform: `translateX(${value}% - 50%)`, // Places the icon at the end of the progress bar
        left: `calc(${value}% - 40px)`, // Adjust to center the icon correctly on the progress bar
      }}
    >
      <img src={musicNote} className="h-6" />
    </div>

    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-celestialPrimary transition-all rounded-lg"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
