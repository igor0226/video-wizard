import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "../../lib/utils";

type SliderProps = React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
  bufferedValue?: number;
};

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, min = 0, max = 100, bufferedValue, ...props }, ref) => {
  const safeMin = Number.isFinite(min) ? min : 0;
  const safeMax = Number.isFinite(max) && max > safeMin ? max : safeMin + 1;
  const rawBuffered = typeof bufferedValue === "number" ? bufferedValue : safeMin;
  const clampedBuffered = Math.min(safeMax, Math.max(safeMin, rawBuffered));
  const bufferedPercent = ((clampedBuffered - safeMin) / (safeMax - safeMin)) * 100;

  return (
    <SliderPrimitive.Root
      ref={ref}
      min={safeMin}
      max={safeMax}
      className={cn("relative flex w-full touch-none select-none items-center", className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-zinc-800">
        <div className="absolute left-0 top-0 h-full bg-zinc-500/80" style={{ width: `${bufferedPercent}%` }} />
        <SliderPrimitive.Range className="absolute h-full bg-zinc-100" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border border-zinc-300 bg-zinc-50 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" />
    </SliderPrimitive.Root>
  );
});
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
