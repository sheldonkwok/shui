import { cva } from "class-variance-authority";
import { TreeDeciduous } from "lucide-react";

const imagePlaceholder = cva(
  "w-44 h-44 flex-shrink-0 bg-gray-50 flex items-center justify-center rounded-l-lg p-4",
);

export function PlantImagePlaceholder() {
  return (
    <div className={imagePlaceholder()}>
      <TreeDeciduous className="w-full h-full text-gray-400" />
    </div>
  );
}
