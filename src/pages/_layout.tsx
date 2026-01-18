import { ReactNode } from "react";
import "../styles/global.css";

interface LayoutProps {
  children: ReactNode;
}

export default async function Layout({ children }: LayoutProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <link rel="icon" type="image/png" href="/shui.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Shui App</title>
      </head>
      <body>
        <div id="app">{children}</div>
      </body>
    </html>
  );
}

export const getConfig = async () => {
  return {
    render: "dynamic",
  };
};
