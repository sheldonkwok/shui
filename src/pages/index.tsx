import { PlantList } from "../components/PlantList.tsx";
import { TabRefresh } from "../components/TabRefresh.tsx";

export default async function HomePage() {
  return (
    <>
      <TabRefresh />

      <PlantList />
    </>
  );
}

export const getConfig = async () => {
  return {
    render: "dynamic",
  };
};
