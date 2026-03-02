import { cva, cx } from "class-variance-authority";
import { useRef, useState } from "react";
import { apiClient } from "../../api/client.ts";
import { cls } from "../../styles/palette.ts";
import { DialogTitle } from "../ui/Dialog.tsx";

const nameContainer = cva("relative");
const editableName = cva("cursor-pointer hover:opacity-70");
const editableNameHidden = cva("invisible pointer-events-none");
const nameInput = cva([
  "absolute top-0 left-0 text-lg leading-normal font-semibold p-0 border-none border-b-2 rounded-none bg-transparent focus:outline-none",
  cls.borderBPrimaryGreen,
]);
const nameInputHidden = cva("invisible pointer-events-none");

interface EditableNameProps {
  plantId: number;
  plantName: string;
  onRenamed: () => void;
  canEdit: boolean;
}

export function EditableName({ plantId, plantName, onRenamed, canEdit }: EditableNameProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(plantName);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleNameClick = () => {
    if (!canEdit) return;
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleNameBlur = async () => {
    setIsEditing(false);
    const trimmed = name.trim();
    if (trimmed && trimmed !== plantName) {
      await apiClient.api.plants[":id"].$patch({
        param: { id: String(plantId) },
        json: { name: trimmed },
      });
      onRenamed();
    } else {
      setName(plantName);
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      inputRef.current?.blur();
    }
    if (e.key === "Escape") {
      setName(plantName);
      setIsEditing(false);
    }
  };

  return (
    <div className={nameContainer()}>
      <DialogTitle
        className={cx(editableName(), isEditing && editableNameHidden())}
        onClick={handleNameClick}
      >
        {name}
      </DialogTitle>
      <input
        ref={inputRef}
        className={cx(nameInput(), !isEditing && nameInputHidden())}
        size={Math.max(1, name.length)}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={handleNameBlur}
        onKeyDown={handleNameKeyDown}
      />
    </div>
  );
}
