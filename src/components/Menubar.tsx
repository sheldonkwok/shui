"use client";

import { cva } from "class-variance-authority";
import { Menu } from "lucide-react";
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
const menuButton = cva(
  "ml-auto bg-transparent border-none cursor-pointer p-1 rounded text-[#666] hover:bg-[#f0f0f0]",
);

export function Menubar() {
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
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <AddPlantForm />
          </DropdownMenuItem>
          <DropdownMenuItem>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
