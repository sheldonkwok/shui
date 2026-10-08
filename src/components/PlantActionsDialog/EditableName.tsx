import { cva, cx } from "class-variance-authority";
import { useRef, useState } from "react";
import { apiClient } from "../../api/client.ts";
import { cls } from "../../styles/palette.ts";
import { DialogTitle } from "../ui/Dialog.tsx";

const nameInput = cva(
  "w-full text-lg pt-1 pb-0 border-0 border-b-2 bg-transparent focus:outline-none truncate",
);
const nameError = cva("text-[11px] leading-tight text-red-700");
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
  const [renameFailed, setRenameFailed] = useState(false);
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
      try {
        const res = await apiClient.api.plants[":id"].$patch({
          param: { id: String(plantId) },
          json: { name: trimmed },
        });
        if (!res.ok) {
          setName(plantName);
          setRenameFailed(true);
          return;
        }
      } catch {
        setName(plantName);
        setRenameFailed(true);
        return;
      }
      setRenameFailed(false);
      onRenamed();
    } else {
      setRenameFailed(false);
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
      {renameFailed && (
        <p className={nameError()} role="alert">
          Couldn't rename
        </p>
      )}
    </>
  );
}
