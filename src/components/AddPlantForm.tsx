"use client";

import { css } from "../../styled-system/css";
import { useRouter } from "waku";
import { addPlant } from "../actions/plants.ts";
import { ChevronRight } from "lucide-react";

const formStyles = css({
  paddingTop: "30px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
});

const inputStyles = css({
  flex: 1,
  padding: "10px",
  border: "1px solid #ddd",
  borderRadius: "4px",
  fontSize: "16px",
  boxSizing: "border-box",
  _focus: {
    outline: "none",
    borderColor: "#2d5f3f",
    boxShadow: "0 0 0 2px rgba(45, 95, 63, 0.2)",
  },
});

const submitButtonStyles = css({
  backgroundColor: "#2d5f3f",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px",
  transition: "background-color 0.2s",
  _hover: {
    backgroundColor: "#1e3f2b",
  },
  _active: {
    transform: "translateY(1px)",
  },
});

export function AddPlantForm() {
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;

    await addPlant(name);
    // Refresh the page to show the new plant
    router.reload();
    // Reset the form
    e.currentTarget.reset();
  };

  return (
    <form className={formStyles} onSubmit={handleSubmit}>
      <input
        className={inputStyles}
        type="text"
        name="name"
        required
        placeholder="Add a new plant"
      />
      <button className={submitButtonStyles} type="submit">
        <ChevronRight size={20} />
      </button>
    </form>
  );
}
