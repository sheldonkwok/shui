import { PlantList } from "../components/PlantList.tsx";
import { AddPlantForm } from "../components/AddPlantForm.tsx";

export default async function HomePage() {
  return (
    <>
      <h1>My Plants</h1>

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
