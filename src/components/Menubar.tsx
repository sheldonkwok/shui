import { css } from "../../styled-system/css";

const menubarStyles = css({
  display: "flex",
  alignItems: "center",
  gap: "8px",
  paddingBottom: "8px",
});

const logoStyles = css({
  width: "40px",
  height: "40px",
});

const titleStyles = css({
  fontSize: "24px",
  fontWeight: "bold",
});

export function Menubar() {
  return (
    <div className={menubarStyles}>
      <img src="/shui.png" alt="Shui" className={logoStyles} />
      <span className={titleStyles}>Shui</span>
    </div>
  );
}
