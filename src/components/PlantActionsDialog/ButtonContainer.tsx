import { cva } from "class-variance-authority";
import { Droplets, Sprout, TimerReset, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "waku";
import { apiClient } from "../../api/client.ts";
import { cls } from "../../styles/palette.ts";
import { ButtonGroup } from "../ui/ButtonGroup.tsx";
import { Input } from "../ui/Input.tsx";
import { Toggle } from "../ui/Toggle.tsx";

const waterButton = cva([
  cls.bgWaterBlue,
  cls.hoverBgWaterBlueDark,
  "text-white border-none h-9 px-3 rounded text-[0.9em] transition-colors [&>svg]:fill-white/0 [&>svg]:transition-[fill] [&>svg]:duration-1000 hover:[&>svg]:animate-[fill-pulse_1s_ease-in-out_infinite] disabled:opacity-40 disabled:cursor-not-allowed",
]);
const buttonContainer = cva("flex flex-col items-end mt-auto pb-3 gap-2");
const buttonRow = cva("flex flex-row items-end gap-4");
const buttonGroup = cva("flex flex-col items-center gap-1");
const lastWateredStyle = cva([
  cls.textSecondary,
  "text-[0.85em] flex items-center justify-center my-[0.25em]",
]);
const lastFertilizedStyle = cva([
  cls.textSecondary,
  "text-[0.85em] flex items-center justify-center my-[0.25em]",
]);
const delayGroupButton = cva([
  "inline-flex items-center justify-center self-stretch w-9 border bg-transparent transition-colors",
  cls.borderInput,
  cls.textPrimaryGreen,
  cls.hoverBgHover,
  "disabled:opacity-40 disabled:cursor-not-allowed",
]);

const formatDaysAgo = (date: Date | null): { days: number } | null => {
  if (!date) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const days = Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
  return { days };
};

interface ButtonContainerProps {
  plantId: number;
  lastWateredDate: Date | null;
  lastFertilizedDate: Date | null;
  loggedIn: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ButtonContainer({
  plantId,
  lastWateredDate,
  lastFertilizedDate,
  loggedIn,
  open,
  onOpenChange,
}: ButtonContainerProps) {
  const router = useRouter();
  const [fertilizeToggled, setFertilizeToggled] = useState(false);
  const [delayDays, setDelayDays] = useState<number | "">(1);
  const [isWatering, setIsWatering] = useState(false);

  useEffect(() => {
    if (!open) {
      setFertilizeToggled(false);
      setDelayDays(1);
      setIsWatering(false);
    }
  }, [open]);

  const handleDelay = async () => {
    if (!delayDays || delayDays < 1) return;
    await apiClient.api.plants[":id"].delay.$post({
      param: { id: String(plantId) },
      json: { numDays: delayDays },
    });
    onOpenChange(false);
    router.reload();
  };

  const handleWater = async () => {
    setIsWatering(true);
    await apiClient.api.plants[":id"].water.$post({
      param: { id: String(plantId) },
      json: { fertilized: fertilizeToggled },
    });
    setFertilizeToggled(false);
    setIsWatering(false);
    onOpenChange(false);
    router.reload();
  };

  return (
    <div className={buttonContainer()}>
      <ButtonGroup>
        <Input
          type="number"
          min={1}
          value={delayDays}
          onChange={(e) => setDelayDays(e.target.value === "" ? "" : Number(e.target.value))}
          disabled={!loggedIn}
          aria-label="Delay days"
          className="w-14 text-center"
        />
        <button
          className={delayGroupButton()}
          type="button"
          onClick={handleDelay}
          disabled={!loggedIn || !delayDays || delayDays < 1}
          aria-label="Delay watering"
        >
          <TimerReset size={18} />
        </button>
      </ButtonGroup>
      <div className={buttonRow()}>
        <div className={buttonGroup()}>
          <p className={lastFertilizedStyle()}>
            {(() => {
              const r = formatDaysAgo(lastFertilizedDate);
              return r ? `${r.days}d` : <X size={14} />;
            })()}
          </p>
          <Toggle
            pressed={fertilizeToggled}
            onPressedChange={setFertilizeToggled}
            disabled={!loggedIn}
            variant="outline"
            aria-label="Toggle fertilize"
          >
            <Sprout size={18} fill={fertilizeToggled ? "currentColor" : "none"} />
          </Toggle>
        </div>
        <div className={buttonGroup()}>
          <p className={lastWateredStyle()}>
            {(() => {
              const r = formatDaysAgo(lastWateredDate);
              return r ? `${r.days}d` : <X size={14} />;
            })()}
          </p>
          <button
            className={`${waterButton()} ${isWatering ? "[&>svg]:animate-[fill-pulse_1s_ease-in-out_infinite]" : ""}`}
            type="button"
            onClick={handleWater}
            disabled={!loggedIn || isWatering}
          >
            <Droplets size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
