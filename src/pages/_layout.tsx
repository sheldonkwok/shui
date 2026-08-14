import type { ReactNode } from "react";
import { Menubar } from "../components/Menubar";

interface LayoutProps {
  children: ReactNode;
}

export default async function Layout({ children }: LayoutProps) {
  return (
    <>
      <Menubar />
      {children}
    </>
  );
}

export const getConfig = async () => {
  return {
    render: "dynamic",
  };
};
