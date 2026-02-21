"use client";

import { cva } from "class-variance-authority";
import { ChevronRight } from "lucide-react";
import { useRouter } from "waku";

const form = cva("flex items-center gap-2");
const input = cva(
  "flex-1 p-2.5 border border-[#ddd] rounded text-base box-border focus:outline-none focus:border-[#2d5f3f] focus:shadow-[0_0_0_2px_rgba(45,95,63,0.2)]",
);
const submitButton = cva(
  "bg-[#2d5f3f] text-white border-none rounded cursor-pointer flex items-center justify-center p-2.5 transition-colors duration-200 hover:bg-[#1e3f2b] active:translate-y-px",
);

export function AddPlantForm() {
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;

    await fetch("/api/plants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    // Refresh the page to show the new plant
    router.reload();
    // Reset the form
    e.currentTarget.reset();
  };

  return (
    <form className={form()} onSubmit={handleSubmit}>
      <input className={input()} type="text" name="name" required placeholder="Add a new plant" />
      <button className={submitButton()} type="submit">
        <ChevronRight size={20} />
      </button>
    </form>
  );
}
