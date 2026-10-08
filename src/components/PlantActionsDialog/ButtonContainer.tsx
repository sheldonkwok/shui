import { cva } from "class-variance-authority";
import { Droplets, Sprout, TimerReset } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "waku";
import { apiClient } from "../../api/client.ts";
import { cls, colors } from "../../styles/palette.ts";
import { Toggle } from "../ui/Toggle.tsx";
import { WheelSelect } from "../ui/WheelSelect.tsx";

const waterButton = cva([
  cls.bgWaterBlue,
  cls.hoverBgWaterBlueDark,
  "flex-1 min-h-[76px] flex items-center justify-center text-white border-none rounded transition-colors active:translate-y-px [&>svg]:fill-white/0 [&>svg]:transition-[fill] [&>svg]:duration-1000 hover:[&>svg]:animate-[fill-pulse_1s_ease-in-out_infinite] disabled:opacity-40 disabled:cursor-not-allowed",
]);
const buttonContainer = cva([
  cls.bgPageBackground,
  "w-[104px] min-[480px]:w-[122px] box-border flex-shrink-0 mt-[18px] pt-0 pr-2.5 pb-[18px] pl-2.5 min-[480px]:pr-3.5 min-[480px]:pl-3.5 flex flex-col gap-2.5 border-l border-[#e5e7eb]",
]);
const delayGroupButton = cva([
  "inline-flex h-9 flex-1 items-center justify-center rounded-md border bg-transparent transition-colors",
  cls.borderInput,
  cls.textPrimaryGreen,
  cls.hoverBgHover,
  "disabled:opacity-40 disabled:cursor-not-allowed",
]);
const delayRow = cva("flex w-full items-center gap-1.5");
const DEFAULT_DELAY_DAYS = 3;
const delayError = cva(["text-[11px] leading-tight text-red-700 text-center"]);

interface ButtonContainerProps {
  plantId: number;
  loggedIn: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ButtonContainer({ plantId, loggedIn, open, onOpenChange }: ButtonContainerProps) {
  const router = useRouter();
  const [fertilizeToggled, setFertilizeToggled] = useState(false);
  const [delayDays, setDelayDays] = useState(DEFAULT_DELAY_DAYS);
  const [isWatering, setIsWatering] = useState(false);
  const [delayFailed, setDelayFailed] = useState(false);
  const [waterFailed, setWaterFailed] = useState(false);

  useEffect(() => {
    if (!open) {
      setFertilizeToggled(false);
      setDelayDays(DEFAULT_DELAY_DAYS);
      setIsWatering(false);
      setDelayFailed(false);
      setWaterFailed(false);
    }
  }, [open]);

  const handleDelay = async () => {
    if (delayDays < 1) return;
    setDelayFailed(false);
    try {
      const res = await apiClient.api.plants[":id"].delay.$post({
        param: { id: String(plantId) },
        json: { numDays: delayDays },
      });
      if (!res.ok) {
        setDelayFailed(true);
        return;
      }
    } catch {
      setDelayFailed(true);
      return;
    }
    onOpenChange(false);
    router.reload();
  };

  const handleWater = async () => {
    setIsWatering(true);
    setWaterFailed(false);
    try {
      const res = await apiClient.api.plants[":id"].water.$post({
        param: { id: String(plantId) },
        json: { fertilized: fertilizeToggled },
      });
      if (!res.ok) {
        setWaterFailed(true);
        return;
      }
      setFertilizeToggled(false);
    } catch {
      setWaterFailed(true);
      return;
    } finally {
      setIsWatering(false);
    }
    onOpenChange(false);
    router.reload();
  };

  return (
    <div className={buttonContainer()}>
      <button
        className={`${waterButton()} ${isWatering ? "[&>svg]:animate-[fill-pulse_1s_ease-in-out_infinite]" : ""}`}
        type="button"
        onClick={handleWater}
        disabled={!loggedIn || isWatering}
        aria-label="Water plant"
      >
        <Droplets size={30} />
      </button>
      <Toggle
        pressed={fertilizeToggled}
        onPressedChange={setFertilizeToggled}
        disabled={!loggedIn}
        variant="outline"
        size="lg"
        aria-label="Toggle fertilize"
        className="w-full"
      >
        <Sprout
          size={18}
          fill={fertilizeToggled ? colors.lightGreen : "none"}
          color={fertilizeToggled ? colors.lightGreen : undefined}
        />
      </Toggle>
      <div className={delayRow()}>
        <WheelSelect
          value={delayDays}
          onChange={setDelayDays}
          min={1}
          max={7}
          disabled={!loggedIn}
          aria-label="Delay days"
        />
        <button
          className={delayGroupButton()}
          type="button"
          onClick={handleDelay}
          disabled={!loggedIn}
          aria-label="Delay watering"
        >
          <TimerReset size={16} />
        </button>
      </div>
      {waterFailed && (
        <p className={delayError()} role="alert">
          Couldn't water
        </p>
      )}
      {delayFailed && (
        <p className={delayError()} role="alert">
          Couldn't delay
        </p>
      )}
    </div>
  );
}
