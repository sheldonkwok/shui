import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export default async function Layout({ children }: LayoutProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Shui App</title>
        <style>{`
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
              sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
          }

          #app {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          }

          h1 {
            color: #2d5f3f;
            margin-bottom: 30px;
            text-align: center;
          }

          .add-plant-form {
            border-top: 2px solid #e9ecef;
            padding-top: 30px;
          }

          .add-plant-form h2 {
            color: #2d5f3f;
            margin-bottom: 20px;
            font-size: 1.2em;
          }

          .form-group {
            margin-bottom: 15px;
          }

          .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
            color: #333;
          }

          .form-group input {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 16px;
            box-sizing: border-box;
          }

          .form-group input:focus {
            outline: none;
            border-color: #2d5f3f;
            box-shadow: 0 0 0 2px rgba(45, 95, 63, 0.2);
          }

          button {
            background-color: #2d5f3f;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 4px;
            font-size: 16px;
            cursor: pointer;
            transition: background-color 0.2s;
          }

          button:hover {
            background-color: #1e3f2b;
          }

          button:active {
            transform: translateY(1px);
          }

          .plant-list {
            margin-bottom: 40px;
          }

          .plant-list ul {
            list-style: none;
            padding: 0;
            margin: 0;
          }

          .no-plants {
            text-align: center;
            color: #6c757d;
            font-style: italic;
            padding: 20px;
          }

          .plant-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            margin-bottom: 10px;
            background-color: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 6px;
          }

          .plant-info {
            display: flex;
            flex-direction: column;
            gap: 5px;
          }

          .plant-name {
            font-weight: 500;
            color: #2d5f3f;
            font-size: 1.1em;
          }

          .watering-stats {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .watering-count {
            color: #4a90e2;
            font-size: 0.9em;
            font-weight: 500;
          }

          .last-watered {
            color: #6c757d;
            font-size: 0.85em;
          }

          .water-form {
            margin: 0;
          }

          .water-button {
            background-color: #4a90e2;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 0.9em;
            cursor: pointer;
            transition: background-color 0.2s;
            display: flex;
            align-items: center;
            gap: 4px;
          }

          .water-button:hover {
            background-color: #357abd;
          }

          .water-button:active {
            transform: translateY(1px);
          }
        `}</style>
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
