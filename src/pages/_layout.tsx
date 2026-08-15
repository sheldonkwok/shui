import type { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export default async function Layout({ children }: LayoutProps) {
  return <>{children}</>;
}

export const getConfig = async () => {
  return {
    render: "dynamic",
  };
};
