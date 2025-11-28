import { ClockIcon, CalendarIcon } from "@heroicons/react/24/outline";
import { useState, useMemo } from "react";
import { Input, Select } from "@/components/Shared/UI";
import cn from "@/helpers/cn";

type DeadlineMode = "datetime" | "duration";
type DurationUnit = "minutes" | "hours" | "days";

interface DeadlineInputProps {
  value?: string; // ISO string or empty
  onChange: (isoString: string) => void;
  error?: boolean;
  name?: string;
  label?: string;
  helper?: string;
}

const DeadlineInput = ({
  value,
  onChange,
  error,
  name,
  label = "Deadline",
  helper,
}: DeadlineInputProps) => {
  // Mode state: datetime picker or duration
  const [mode, setMode] = useState<DeadlineMode>("datetime");

  // Duration state
  const [durationValue, setDurationValue] = useState<number>(7);
  const [durationUnit, setDurationUnit] = useState<DurationUnit>("days");

  // Parse current value to datetime-local format (YYYY-MM-DDTHH:mm)
  const datetimeLocalValue = useMemo(() => {
    if (!value) {
      // Default to 7 days from now
      const defaultDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      return formatDatetimeLocal(defaultDate);
    }
    const date = new Date(value);
    return formatDatetimeLocal(date);
  }, [value]);

  // Min datetime-local value (current time)
  const minDatetimeLocal = useMemo(() => {
    return formatDatetimeLocal(new Date());
  }, []);

  function formatDatetimeLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  const handleDatetimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const localDatetime = e.target.value; // YYYY-MM-DDTHH:mm
    if (!localDatetime) {
      onChange("");
      return;
    }
    // Convert to Date object and then to ISO string
    const date = new Date(localDatetime);
    onChange(date.toISOString());
  };

  const handleDurationChange = (newValue?: number, newUnit?: DurationUnit) => {
    const val = newValue ?? durationValue;
    const unit = newUnit ?? durationUnit;

    if (val <= 0) return;

    const now = Date.now();
    let milliseconds: number;

    switch (unit) {
      case "minutes":
        milliseconds = val * 60 * 1000;
        break;
      case "hours":
        milliseconds = val * 60 * 60 * 1000;
        break;
      case "days":
        milliseconds = val * 24 * 60 * 60 * 1000;
        break;
      default:
        milliseconds = val * 24 * 60 * 60 * 1000; // Default to days
    }

    const futureDate = new Date(now + milliseconds);
    onChange(futureDate.toISOString());
  };

  const handleModeSwitch = (newMode: DeadlineMode) => {
    setMode(newMode);
    if (newMode === "duration") {
      // When switching to duration mode, calculate from current value
      handleDurationChange();
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* Label */}
      {label && (
        <div className="flex items-center justify-between">
          <label className="font-medium text-gray-800 dark:text-gray-200">
            {label}
          </label>
          {helper && (
            <span className="text-gray-500 text-xs dark:text-gray-400">
              {helper}
            </span>
          )}
        </div>
      )}

      {/* Mode Toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleModeSwitch("datetime")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all",
            mode === "datetime"
              ? "border-gray-700 bg-gray-900 text-white dark:border-gray-300 dark:bg-white dark:text-gray-900"
              : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-600"
          )}
        >
          <CalendarIcon className="h-4 w-4" />
          <span>Specific Date & Time</span>
        </button>
        <button
          type="button"
          onClick={() => handleModeSwitch("duration")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all",
            mode === "duration"
              ? "border-gray-700 bg-gray-900 text-white dark:border-gray-300 dark:bg-white dark:text-gray-900"
              : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-600"
          )}
        >
          <ClockIcon className="h-4 w-4" />
          <span>Duration</span>
        </button>
      </div>

      {/* Input based on mode */}
      {mode === "datetime" ? (
        <div className="relative">
          <input
            type="datetime-local"
            value={datetimeLocalValue}
            min={minDatetimeLocal}
            onChange={handleDatetimeChange}
            name={name}
            className={cn(
              "w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-hidden focus:border-gray-500 focus:ring-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white",
              { "!border-red-500": error }
            )}
          />
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            type="number"
            min="1"
            value={durationValue}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (val > 0) {
                setDurationValue(val);
                handleDurationChange(val, undefined);
              }
            }}
            placeholder="e.g: 7"
            className="flex-1"
            error={error}
            skipWrapper={false}
          />
          <Select
            className="w-32"
            defaultValue={durationUnit}
            onChange={(val: DurationUnit) => {
              setDurationUnit(val);
              handleDurationChange(undefined, val);
            }}
            options={[
              { label: "Minutes", value: "minutes" },
              { label: "Hours", value: "hours" },
              { label: "Days", value: "days" },
            ]}
          />
        </div>
      )}

      {/* Preview */}
      {value && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-600 text-sm dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400">
          <span className="font-medium">Deadline: </span>
          {new Date(value).toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </div>
      )}
    </div>
  );
};

export default DeadlineInput;
