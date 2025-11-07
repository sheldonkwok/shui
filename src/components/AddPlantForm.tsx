'use client';

import { useRouter } from 'waku';
import { addPlant } from '../actions/plants.ts';

export function AddPlantForm() {
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;

    await addPlant(name);
    // Refresh the page to show the new plant
    router.reload();
    // Reset the form
    e.currentTarget.reset();
  };

  return (
    <form className="add-plant-form" onSubmit={handleSubmit}>
      <h2>Add New Plant</h2>
      <div className="form-group">
        <label htmlFor="plant-name">Plant Name:</label>
        <input
          type="text"
          id="plant-name"
          name="name"
          required
          placeholder="Enter plant name"
        />
      </div>
      <button type="submit">Add Plant</button>
    </form>
  );
}