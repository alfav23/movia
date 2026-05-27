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

  const quotes = ["Frankly, my dear, I don’t give a damn.", "I'm going to make him an offer he can't refuse.", "Here's looking at you, kid.", "Go ahead, make my day.", "I'm ready for my closeup.", "May the Force be with you.", "You talking to me?", "E.T. phone home.", "Rosebud.", "Made it, Ma! Top of the world!","Bond. James Bond." ];

  const [ prompt, setPrompt ] = useState<number | null>(null);
  const [ quote, setquote ] = useState<number>(0);

  useEffect(()=> {
    setPrompt(Math.floor(Math.random()*(prompts.length)))
  }, []);

  useEffect(()=> {
    let timer = setTimeout(() => {
      setquote(Math.floor(Math.random()*(quotes.length)))
    }, 5000);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    await onSubmit(query);
  };

  return (
    <div className="form-container items-center justify-center">
      <form className="m-10 flex flex-col gap-x-6 gap-y-8 form" onSubmit={handleSubmit}>
        <div className="input-container flex gap-x-4 justify-center">
          <label className="text-xl p-1 text-center form form-label" htmlFor="input">{prompt === null ? "Loading..." : prompts[prompt]}</label>
          <input 
            id="input"
            className="form form-input border dark:border-white border-black rounded-sm pl-2" 
            type="text"
            pattern="\w+"
            placeholder="Enter only one word."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="button-container justify-center flex">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? `${quotes[quote]}...` : "Suggest Movies"}
          </Button>
        </div>
      </form>
    </div>
  );
}