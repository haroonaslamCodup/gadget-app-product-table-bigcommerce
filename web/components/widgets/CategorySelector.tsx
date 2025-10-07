import { useQuery } from "@tanstack/react-query";
import { MultiSelect, FormGroup } from "@bigcommerce/big-design";
import { useState, useEffect } from "react";

interface CategorySelectorProps {
  selectedCategories: string[];
  onChange: (selected: string[]) => void;
}

export const CategorySelector = ({ selectedCategories, onChange }: CategorySelectorProps) => {
  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await fetch("/api/collections");
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      return response.json();
    },
  });

  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    if (categoriesData) {
      setCategories(categoriesData.collections || []);
    }
  }, [categoriesData]);

  const categoryOptions = categories.map((category) => ({
    value: category.id.toString(),
    content: category.name,
  }));

  return (
    <FormGroup>
      <MultiSelect
        label="Select Categories"
        description="Choose one or more categories to display products from"
        placeholder={isLoading ? "Loading categories..." : "Select categories..."}
        options={categoryOptions}
        value={selectedCategories}
        onOptionsChange={(values) => onChange(values)}
        filterable
        disabled={isLoading || categories.length === 0}
      />
    </FormGroup>
  );
};