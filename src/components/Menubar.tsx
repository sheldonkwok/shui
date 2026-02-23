"use client";

import { cva } from "class-variance-authority";
import { Menu } from "lucide-react";
import { useSession } from "../hooks/useSession.ts";
import { cls } from "../styles/palette.ts";
import { AddPlantForm } from "./AddPlantForm.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/DropdownMenu.tsx";

const menubar = cva("flex items-center gap-2 pb-2");
const logo = cva("w-[30px] h-[30px]");
const title = cva("text-2xl font-bold");
const menuButton = cva([
  "ml-auto bg-transparent border-none cursor-pointer p-1 rounded",
  cls.textIcon,
  cls.hoverBgHover,
]);
const authLink = cva("no-underline text-inherit");

export function Menubar() {
  const { loggedIn } = useSession();
  return (
    <div className={menubar()}>
      <img src="/shui.png" alt="Shui" className={logo()} />
      <span className={title()}>Shui</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className={menuButton()}>
            <Menu size={24} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {loggedIn && (
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <AddPlantForm />
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <a href={loggedIn ? "/auth/logout" : "/auth/google"} className={authLink()}>
              {loggedIn ? "Logout" : "Login"}
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
