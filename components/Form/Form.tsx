"use client";
import { Button } from "../ui/button";
import { useState } from "react";

interface FormProps {
  onSubmit: (query: string) => Promise<void>;
  isLoading?: boolean;
}

export default function Form({ onSubmit, isLoading = false }: FormProps) {
  const [query, setQuery] = useState<string>("");

  const prompts = ["What's your favorite color?", "What's your mood?", "What's the weather?", "How old are you?", "Dream job?", "Favorite city?"];

  let prompt = Math.floor(Math.random()*(prompts.length)) + 1;

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    await onSubmit(query);
  };

  return (
    <>
      <form className="form" onSubmit={handleSubmit}>
        <label htmlFor="input">{prompts[prompt]}</label>
        <input 
          id="input"
          className="input border border-white rounded-sm" 
          type="text"
          pattern="\w+"
          placeholder="Enter only one word."
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