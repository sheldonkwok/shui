"use client";

import { cva } from "class-variance-authority";
import { ChevronRight } from "lucide-react";
import { useRouter } from "waku";
import { apiClient } from "../api/client.ts";
import { cls } from "../styles/palette.ts";

const form = cva("flex items-center gap-2");
const input = cva([
  "flex-1 p-2.5 border rounded text-base box-border focus:outline-none",
  cls.borderInput,
  cls.focusBorderPrimaryGreen,
  cls.focusShadowPrimaryGreen,
]);
const submitButton = cva([
  cls.bgPrimaryGreen,
  cls.hoverBgPrimaryGreenDark,
  "text-white border-none rounded cursor-pointer flex items-center justify-center p-2.5 transition-colors duration-200 active:translate-y-px",
]);

export function AddPlantForm() {
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;

    await apiClient.api.plants.$post({ json: { name } });
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
