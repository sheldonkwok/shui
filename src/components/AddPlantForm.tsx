"use client";

import { css } from "../../styled-system/css";
import { useRouter } from "waku";
import { addPlant } from "../actions/plants.ts";
import * as palette from "../styles/palette.ts";

const formStyles = css({
  paddingTop: "30px",
});

const titleStyles = css({
  color: palette.green,
  marginBottom: "20px",
  fontSize: "1.2em",
});

const formGroupStyles = css({
  marginBottom: "15px",
});

const labelStyles = css({
  display: "block",
  marginBottom: "5px",
  fontWeight: 500,
  color: palette.textBody,
});

const inputStyles = css({
  width: "100%",
  padding: "10px",
  border: `1px solid ${palette.border}`,
  borderRadius: "4px",
  fontSize: "16px",
  boxSizing: "border-box",
  _focus: {
    outline: "none",
    borderColor: palette.green,
    boxShadow: `0 0 0 2px ${palette.greenFocusShadow}`,
  },
});

const submitButtonStyles = css({
  backgroundColor: palette.green,
  color: palette.bgWhite,
  padding: "12px 24px",
  border: "none",
  borderRadius: "4px",
  fontSize: "16px",
  cursor: "pointer",
  transition: "background-color 0.2s",
  _hover: {
    backgroundColor: palette.greenDark,
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
      <h2 className={titleStyles}>Add New Plant</h2>
      <div className={formGroupStyles}>
        <label className={labelStyles} htmlFor="plant-name">
          Plant Name:
        </label>
        <input
          className={inputStyles}
          type="text"
          id="plant-name"
          name="name"
          required
          placeholder="Enter plant name"
        />
      </div>
      <button className={submitButtonStyles} type="submit">
        Add Plant
      </button>
    </form>
  );
}
