import { useEffect, useRef, KeyboardEvent } from "react";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  className?: string;
}

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  className = "",
}: SegmentedControlProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = options.findIndex((opt) => opt.value === value);
    let newIndex = currentIndex;

    switch (e.key) {
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
        break;
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        newIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
        break;
      case "Home":
        e.preventDefault();
        newIndex = 0;
        break;
      case "End":
        e.preventDefault();
        newIndex = options.length - 1;
        break;
      default:
        return;
    }

    if (newIndex !== currentIndex) {
      onChange(options[newIndex].value);
    }
  };

  useEffect(() => {
    // Focus the active segment when navigating with keyboard
    const activeButton = containerRef.current?.querySelector(
      '[aria-checked="true"]',
    ) as HTMLButtonElement;
    if (document.activeElement === containerRef.current && activeButton) {
      activeButton.focus();
    }
  }, [value]);

  return (
    <div className={className}>
      {label && (
        <label className="text-xs sm:text-sm theme-text-muted mb-2 block">
          {label}
        </label>
      )}
      <div
        ref={containerRef}
        role="radiogroup"
        aria-label={label || "Filter options"}
        onKeyDown={handleKeyDown}
        className="theme-segmented-control inline-flex rounded-lg p-1 w-full sm:w-auto"
      >
        {options.map((option) => {
          const isActive = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => onChange(option.value)}
              className={`
                flex-1 sm:flex-initial sm:min-w-[100px] px-4 sm:px-6 py-2 rounded-md
                text-sm sm:text-base font-medium transition-all
                min-h-[38px] sm:min-h-[38px]
                focus:outline-none focus:ring-2 focus:ring-offset-1
                ${
                  isActive
                    ? "theme-segmented-option-active"
                    : "theme-segmented-option"
                }
              `}
              style={
                isActive
                  ? {
                      background: "var(--btn-orange-bg)",
                      color: "var(--btn-orange-text)",
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                    }
                  : undefined
              }
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
