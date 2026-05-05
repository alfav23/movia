"use client";
import { Button } from "../ui/button";
import { useEffect, useState } from "react";

interface FormProps {
  onSubmit: (query: string) => Promise<void>;
  isLoading?: boolean;
}

export default function Form({ onSubmit, isLoading = false }: FormProps) {
  const [query, setQuery] = useState<string>("");

  const prompts = ["What's your favorite color?", "What's your mood?", "What's the weather?", "Birth year?", "Dream job?", "Favorite city?", "Zodiac sign?"];

  const [ prompt, setPrompt ] = useState<number | null>(null);

  useEffect(()=> {
    setPrompt(Math.floor(Math.random()*(prompts.length)))
  }, []);

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    await onSubmit(query);
  };

  return (
    <div className="form-container items-center justify-center">
      <form className="m-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-3 form" onSubmit={handleSubmit}>
        <label className="text-xl p-1 text-center form form-label" htmlFor="input">{prompt === null ? "Loading..." : prompts[prompt]}</label>
        <input 
          id="input"
          className="form form-input border dark:border-white border-black rounded-sm" 
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
    </div>
  );
}