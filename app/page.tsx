"use client";
import Form from "@/components/Form";
import { useState } from "react";

export default function Page() {
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/search-movies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch movies");
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div>
        <p>Hi, my name is Movia. What do you want to watch?</p>
      </div>
      <Form onSubmit={handleSearch} isLoading={isLoading} />
      
      {error && (
        <div className="text-red-500 mt-4">
          Error: {error}
        </div>
      )}

      {results && (
        <div className="p-4 rounded">
          {JSON.stringify(results.choices[0].message.content, null, 4)}
        </div>
        
      )}

      <div className="font-mono text-xs text-muted-foreground mt-8">
          (Press <kbd>d</kbd> to toggle dark mode)
      </div>
    </div>
  );
}
