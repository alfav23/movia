"use client";
import Form from "@/components/Form";
import { useState } from "react";
import { Movie } from "./api/search-movies/route";

import rehypeStringify from 'rehype-stringify';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import {unified} from 'unified';

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
      console.log(data);
      if (data.error){
        setError(data.error.message)
        return
      }
      setResults(data.results[0]);
      const processor = unified()
        .use(remarkParse)
        .use(remarkRehype, {allowDangerousHtml: true})
        .use(rehypeStringify)

        const movies = await processor.process(results);

      console.log(String(movies));

      console.log(results);
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
        //markdown library component around div, add movie poster results
        <div className="p-4 rounded movies">
          {console.log(results)}
         { results.map((movie: Movie) => (
            <div key={movie.id} className="movie">
              <img src={movie.poster_path} alt={`poster for ${movie.title}`} />
              <h1 className="movie movie_title">
                {`${movie.title} ( ${movie.year} )`}
              </h1>
              <p className="movie movie_synopsis">{movie.synopsis}</p>
            </div>
          ))}
        </div>
        
      )}

      <div className="font-mono text-xs text-muted-foreground mt-8">
          (Press <kbd>d</kbd> to toggle dark mode)
      </div>
    </div>
  );
}
