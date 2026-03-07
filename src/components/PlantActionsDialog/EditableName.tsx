import { cva, cx } from "class-variance-authority";
import { useRef, useState } from "react";
import { apiClient } from "../../api/client.ts";
import { cls } from "../../styles/palette.ts";
import { DialogTitle } from "../ui/Dialog.tsx";

const nameInput = cva("w-full text-lg pt-1 pb-0 border-0 border-b-2 bg-transparent focus:outline-none");
const nameInputReadOnly = cva("border-b-transparent cursor-pointer hover:opacity-70");
const nameInputEditing = cva(["cursor-text", cls.borderBPrimaryGreen]);

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
    inputRef.current?.focus();
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
    <>
      <DialogTitle className="sr-only">{name}</DialogTitle>
      <input
        ref={inputRef}
        className={cx(nameInput(), isEditing ? nameInputEditing() : nameInputReadOnly())}
        readOnly={!isEditing}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onClick={handleNameClick}
        onBlur={handleNameBlur}
        onKeyDown={handleNameKeyDown}
      />
    </>
  );
}
