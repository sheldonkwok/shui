"use client";

import { cva, cx } from "class-variance-authority";
import { useEffect, useRef, useState } from "react";
import { cls } from "../../styles/palette.ts";
import { Popover, PopoverAnchor, PopoverContent } from "../ui/Popover.tsx";

const speciesInput = cva(
  "text-sm font-normal italic w-full border-0 border-b-2 bg-transparent focus:outline-none",
);
const speciesInputReadOnly = cva("border-b-transparent cursor-pointer hover:opacity-70");
const speciesInputEditing = cva(["cursor-text", cls.borderBPrimaryGreen]);
const suggestionItem = cva(["px-2 py-1.5 text-sm cursor-pointer rounded-sm", cls.hoverBgHover]);

interface GbifSuggestion {
  canonicalName: string;
  scientificName: string;
}

interface EditableSpeciesProps {
  plantId: number;
  species: string | null;
  onClassified: () => void;
  canEdit: boolean;
}

export function EditableSpecies({ plantId, species, onClassified, canEdit }: EditableSpeciesProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(species ?? "");
  const [suggestions, setSuggestions] = useState<GbifSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const committingRef = useRef(false);

  useEffect(() => {
    setInputValue(species ?? "");
  }, [species]);

  const handleClick = () => {
    if (!canEdit) return;
    setIsEditing(true);
    inputRef.current?.focus();
  };

  const fetchSuggestions = (query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 5) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api.gbif.org/v1/species/suggest?q=${encodeURIComponent(query)}&limit=10`,
        );
        const data: GbifSuggestion[] = await res.json();
        const results = data.filter((s) => s.canonicalName);
        setSuggestions(results);
        setIsOpen(results.length > 0);
      } catch {
        setSuggestions([]);
        setIsOpen(false);
      }
    }, 300);
  };

  const classify = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || trimmed === species) {
      setInputValue(species ?? "");
      setIsEditing(false);
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    try {
      const res = await fetch(`/api/plants/${plantId}/classify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ species: trimmed }),
      });
      if (res.ok) {
        onClassified();
      } else {
        setInputValue(species ?? "");
      }
    } catch {
      setInputValue(species ?? "");
    }
    setIsEditing(false);
    setSuggestions([]);
    setIsOpen(false);
  };

  const handleSuggestionSelect = (name: string) => {
    committingRef.current = true;
    setIsOpen(false);
    setSuggestions([]);
    setInputValue(name);
    classify(name);
  };

  const handleBlur = () => {
    if (!isEditing) return;
    if (committingRef.current) {
      committingRef.current = false;
      return;
    }
    setTimeout(() => {
      if (committingRef.current) return;
      classify(inputValue);
    }, 150);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isEditing) return;
    if (e.key === "Enter") {
      committingRef.current = true;
      inputRef.current?.blur();
      classify(inputValue);
    }
    if (e.key === "Escape") {
      committingRef.current = true;
      setInputValue(species ?? "");
      setIsEditing(false);
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverAnchor asChild>
        <input
          ref={inputRef}
          className={cx(speciesInput(), isEditing ? speciesInputEditing() : speciesInputReadOnly())}
          readOnly={!isEditing}
          value={inputValue}
          placeholder={canEdit && !isEditing ? "Add species..." : undefined}
          onChange={(e) => {
            setInputValue(e.target.value);
            fetchSuggestions(e.target.value);
          }}
          onClick={handleClick}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
      </PopoverAnchor>
      <PopoverContent
        className="w-64 p-1"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={() => setIsOpen(false)}
      >
        {suggestions.map((s) => (
          <button
            key={s.scientificName}
            type="button"
            className={cx(suggestionItem())}
            onMouseDown={(e) => {
              e.preventDefault();
              handleSuggestionSelect(s.canonicalName);
            }}
          >
            {s.canonicalName}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
