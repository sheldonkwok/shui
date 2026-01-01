"use client";

import styled from "@emotion/styled";
import { useRouter } from "waku";
import { addPlant } from "../actions/plants.ts";

const Form = styled.form`
  padding-top: 30px;
`;

const Title = styled.h2`
  color: #2d5f3f;
  margin-bottom: 20px;
  font-size: 1.2em;
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #333;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #2d5f3f;
    box-shadow: 0 0 0 2px rgba(45, 95, 63, 0.2);
  }
`;

const SubmitButton = styled.button`
  background-color: #2d5f3f;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #1e3f2b;
  }

  &:active {
    transform: translateY(1px);
  }
`;

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
    <Form onSubmit={handleSubmit}>
      <Title>Add New Plant</Title>
      <FormGroup>
        <Label htmlFor="plant-name">Plant Name:</Label>
        <Input
          type="text"
          id="plant-name"
          name="name"
          required
          placeholder="Enter plant name"
        />
      </FormGroup>
      <SubmitButton type="submit">Add Plant</SubmitButton>
    </Form>
  );
}
