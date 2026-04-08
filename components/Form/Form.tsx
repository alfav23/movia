"use client";
import { Button } from "../ui/button";
import { useState } from "react";

interface FormProps {
  onSubmit: (query: string) => Promise<void>;
  isLoading?: boolean;
}

export default function Form({ onSubmit, isLoading = false }: FormProps) {
  const [query, setQuery] = useState<string>("");

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    await onSubmit(query);
  };

  return (
    <>
      <form className="form" onSubmit={handleSubmit}>
        <label htmlFor="input">Pick a color. </label>
        <input 
          id="input"
          className="input border border-white rounded-sm" 
          type="text"
          placeholder=""
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Searching..." : "Suggest Movies"}
        </Button>
      </form>
    </>
  );
}