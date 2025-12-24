import { PlantList } from "../components/PlantList.tsx";
import { AddPlantForm } from "../components/AddPlantForm.tsx";

export default async function HomePage() {
  return (
    <>
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
