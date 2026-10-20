"use client";

import { cva } from "class-variance-authority";
import { Circle, CircleCheck, Plus, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "waku";
import { apiClient } from "../api/client.ts";
import { formatMonthRange, monthName } from "../garden-utils.ts";
import { cls } from "../styles/palette.ts";
import type { ChoreWithStatus, PlantWithStats } from "../types.ts";

const section = cva("pt-[14px]");
const header = cva("flex items-center justify-between pl-3 pr-[18px] h-8");
const heading = cva([cls.textSecondary, "text-[11px] font-semibold uppercase tracking-wider"]);
const iconButton = cva([
  cls.textPrimaryGreen,
  cls.hoverBgHover,
  "w-7 h-7 flex items-center justify-center rounded border-none bg-transparent cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
]);
const list = cva("list-none p-0 m-0");
const choreRow = cva("flex items-center gap-2 min-h-[40px] pl-1.5 pr-[14px]", {
  variants: {
    status: { due: "", done: "", upcoming: "opacity-50" },
  },
});
const choreText = cva("flex-1 min-w-0 flex flex-col");
const choreTitle = cva(["text-[15px] truncate", cls.textPrimaryGreen], {
  variants: { done: { true: "line-through opacity-60", false: "" } },
});
const choreMeta = cva([cls.textSecondary, "text-[12px] truncate"]);
const empty = cva(["pl-3 text-[13px] italic", cls.textMuted]);
const form = cva("flex flex-col gap-2 pl-3 pr-[18px] pb-2");
const formRow = cva("flex items-center gap-2");
const textInput = cva([
  cls.textPrimaryGreenDark,
  cls.borderBPrimaryGreen,
  "flex-1 min-w-0 bg-transparent border-0 border-b-2 outline-none text-[15px] py-1 px-0.5",
]);
const select = cva([
  cls.borderInput,
  cls.textPrimaryGreen,
  "h-8 rounded-md border bg-transparent px-1.5 text-[13px]",
]);
const addButton = cva([
  cls.bgPrimaryGreen,
  cls.hoverBgPrimaryGreenDark,
  "ml-auto h-8 px-3 rounded-md border-none text-white text-[13px] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed",
]);
const errorText = cva("pl-3 text-[11px] leading-tight text-red-700");

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

interface ChoreListProps {
  chores: ChoreWithStatus[];
  /** Outdoor plants a new chore can be tied to. */
  plants: PlantWithStats[];
  loggedIn: boolean;
}

export function ChoreList({ chores, plants, loggedIn }: ChoreListProps) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const thisMonth = new Date().getMonth() + 1;
  const [startMonth, setStartMonth] = useState(thisMonth);
  const [endMonth, setEndMonth] = useState(thisMonth);
  const [plantId, setPlantId] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Runs a chore request and reloads on success, showing `failure` otherwise.
  const send = async (request: () => Promise<{ ok: boolean }>, failure: string) => {
    setPending(true);
    setError(null);
    try {
      const res = await request();
      if (!res.ok) {
        setError(failure);
        return false;
      }
      router.reload();
      return true;
    } catch {
      setError(failure);
      return false;
    } finally {
      setPending(false);
    }
  };

  const handleAdd = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const ok = await send(
      () => apiClient.api.garden.chores.$post({ json: { title: trimmed, startMonth, endMonth, plantId } }),
      "Couldn't add chore",
    );
    if (ok) {
      setTitle("");
      setAdding(false);
    }
  };

  const toggleDone = (chore: ChoreWithStatus) => {
    const param = { id: String(chore.id) };
    send(
      () =>
        chore.status === "done"
          ? apiClient.api.garden.chores[":id"].complete.$delete({ param })
          : apiClient.api.garden.chores[":id"].complete.$post({ param }),
      "Couldn't update chore",
    );
  };

  const remove = (chore: ChoreWithStatus) => {
    send(
      () => apiClient.api.garden.chores[":id"].$delete({ param: { id: String(chore.id) } }),
      "Couldn't delete chore",
    );
  };

  return (
    <section className={section()} aria-label="Seasonal chores">
      <div className={header()}>
        <h2 className={heading()}>Chores</h2>
        {loggedIn && (
          <button
            type="button"
            className={iconButton()}
            onClick={() => setAdding((a) => !a)}
            aria-label={adding ? "Cancel new chore" : "Add a chore"}
          >
            {adding ? <X size={16} /> : <Plus size={16} />}
          </button>
        )}
      </div>

      {adding && (
        <div className={form()}>
          <input
            className={textInput()}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd();
              }
            }}
            placeholder="New chore, e.g. Prune roses"
            aria-label="Chore"
            disabled={pending}
            // biome-ignore lint/a11y/noAutofocus: the form only opens when the user asks for it
            autoFocus
          />
          <div className={formRow()}>
            <select
              className={select()}
              value={startMonth}
              onChange={(e) => setStartMonth(Number(e.target.value))}
              aria-label="From month"
            >
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {monthName(m)}
                </option>
              ))}
            </select>
            <span className={choreMeta()}>to</span>
            <select
              className={select()}
              value={endMonth}
              onChange={(e) => setEndMonth(Number(e.target.value))}
              aria-label="To month"
            >
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {monthName(m)}
                </option>
              ))}
            </select>
          </div>
          <div className={formRow()}>
            <select
              className={select()}
              value={plantId ?? ""}
              onChange={(e) => setPlantId(e.target.value ? Number(e.target.value) : null)}
              aria-label="Chore plant"
            >
              <option value="">Whole garden</option>
              {plants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={addButton()}
              onClick={handleAdd}
              disabled={pending || !title.trim()}
            >
              Add
            </button>
          </div>
        </div>
      )}

      {chores.length > 0 ? (
        <ul className={list()}>
          {chores.map((chore) => (
            <li key={chore.id} className={choreRow({ status: chore.status })}>
              <button
                type="button"
                className={iconButton()}
                onClick={() => toggleDone(chore)}
                disabled={!loggedIn || pending || chore.status === "upcoming"}
                aria-label={
                  chore.status === "done" ? `Mark ${chore.title} not done` : `Mark ${chore.title} done`
                }
              >
                {chore.status === "done" ? <CircleCheck size={18} /> : <Circle size={18} />}
              </button>
              <div className={choreText()}>
                <span className={choreTitle({ done: chore.status === "done" })}>{chore.title}</span>
                <span className={choreMeta()}>
                  {[chore.plantName, formatMonthRange(chore.startMonth, chore.endMonth)]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </div>
              {loggedIn && (
                <button
                  type="button"
                  className={iconButton()}
                  onClick={() => remove(chore)}
                  disabled={pending}
                  aria-label={`Delete ${chore.title}`}
                >
                  <X size={14} />
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        !adding && <p className={empty()}>No seasonal chores yet.</p>
      )}
      {error && (
        <p className={errorText()} role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
