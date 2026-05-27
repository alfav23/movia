"use client";
import Form from "@/components/Form";
import { useState } from "react";
import { Movie } from "./api/search-movies/route";

import rehypeStringify from 'rehype-stringify';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import {unified} from 'unified';
import Link from "next/link";
import { Card } from "@/components/ui/card";

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
    <div className="page-content">
      <Card className="flex justify-center items-center min-w-svw min-h-svh">
        <div className="header">
          <h1 className="mt-10 text-2xl font-bold header text-center">
            Hi, my name is Movia. 
            <br></br>
            What do you want to watch?
          </h1>
        </div>
        <Form onSubmit={handleSearch} isLoading={isLoading} />
      </Card>
      {error && (
        <div className="text-red-500 mt-4">
          Error: {error}
        </div>
      )}
      

      {results && (
        //markdown library component around div, add movie poster results
        <div className="p-4 rounded flex-wrap results">
          {console.log(results)}
         { results.map((movie: Movie) => (
            <div key={movie.id} className="movie-card movie text-center border-2 m-5 p-10 gap-x-4 max-w-300">
              <Link className='flex justify-center' href={`https://www.themoviedb.org/movie/${movie.id}`} target="_blank">
                <img src={movie.poster_path} alt={`poster for ${movie.title}`} width={200} className="movie-card movie-poster flex justify-center"/>
              </Link>
              <Link href={`https://www.themoviedb.org/movie/${movie.id}`} target="_blank">
                <h1 className="movie-card movie-title">
                  {`${movie.title}`}
                </h1>
              </Link>
              <h1 className="movie-card movie-year">
                {`( ${movie.year} )`}
              </h1>
              <p className="movie-card movie-synopsis">
                {movie.overview}
              </p>
            </div>
          ))}
        </div>
        
      )}

      <div className="toggle text-center items-end font-mono text-xs text-muted-foreground mt-8">
          (Press <kbd>d</kbd> to toggle dark mode)
      </div>
    </div>
  );
}
