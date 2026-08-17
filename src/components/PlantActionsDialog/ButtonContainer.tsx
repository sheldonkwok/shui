import { cva } from "class-variance-authority";
import { Droplets, Sprout, TimerReset } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "waku";
import { apiClient } from "../../api/client.ts";
import { cls, colors } from "../../styles/palette.ts";
import { ButtonGroup } from "../ui/ButtonGroup.tsx";
import { Input } from "../ui/Input.tsx";
import { Toggle } from "../ui/Toggle.tsx";

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
  "inline-flex flex-1 items-center justify-center self-stretch border bg-transparent transition-colors",
  cls.borderInput,
  cls.textPrimaryGreen,
  cls.hoverBgHover,
  "disabled:opacity-40 disabled:cursor-not-allowed",
]);

interface ButtonContainerProps {
  plantId: number;
  loggedIn: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ButtonContainer({ plantId, loggedIn, open, onOpenChange }: ButtonContainerProps) {
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
      <ButtonGroup className="w-full">
        <Input
          type="number"
          min={1}
          value={delayDays}
          onChange={(e) => setDelayDays(e.target.value === "" ? "" : Number(e.target.value))}
          disabled={!loggedIn}
          aria-label="Delay days"
          // min-w-0 so the number input's intrinsic size (spinner + default cols)
          // doesn't win over the width and push the delay button out of the dialog.
          className="w-12 min-w-0 px-1 min-[480px]:w-14 min-[480px]:px-3 text-center"
        />
        <button
          className={delayGroupButton()}
          type="button"
          onClick={handleDelay}
          disabled={!loggedIn || !delayDays || delayDays < 1}
          aria-label="Delay watering"
        >
          <TimerReset size={16} />
        </button>
      </ButtonGroup>
    </div>
  );
}
