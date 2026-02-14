import { cva } from "class-variance-authority";

const menubar = cva("flex items-center gap-2 pb-2");
const logo = cva("w-[30px] h-[30px]");
const title = cva("text-2xl font-bold");

export function Menubar() {
  return (
    <div className={menubar()}>
      <img src="/shui.png" alt="Shui" className={logo()} />
      <span className={title()}>Shui</span>
    </div>
  );
}
