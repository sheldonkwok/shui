import { PlantList } from "../components/PlantList.tsx";
import { AddPlantForm } from "../components/AddPlantForm.tsx";
import { TabRefresh } from "../components/TabRefresh.tsx";

export default async function HomePage() {
  return (
    <>
      <TabRefresh />

      <PlantList />

      <AddPlantForm />
    </>
  );
}

export const getConfig = async () => {
  return {
    render: "dynamic",
  };
};
