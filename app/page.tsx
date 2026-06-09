"use client";
import Form from "@/components/Form";
import { useState } from "react";
import type { Movie } from "./api/search-movies/route";
import Link from "next/link";
import { Card } from "@/components/ui/card";

export default function Page() {
  const [results, setResults] = useState<Movie[]>([]);
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

      const data = await response.json();
      if (!response.ok) {
        const message =
          data?.error?.details ||
          data?.error?.message ||
          (typeof data?.error === "string" ? data.error : null) ||
          response.statusText ||
          "Failed to fetch movies";
        throw new Error(message);
      }

      if (data.error) {
        const message =
          data.error.details ||
          data.error.message ||
          (typeof data.error === "string" ? data.error : null) ||
          "Failed to fetch movies";
        throw new Error(message);
      }

      const resultsArray = Array.isArray(data.results)
        ? data.results.flat()
        : Array.isArray(data)
        ? data
        : [];

      setResults(resultsArray as Movie[]);
      console.log("Movie search response:", data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-content">
      <Card className="p-20 flex justify-center items-center max-w-svw max-h-svh">
        <div className="header">
          <h1 className="text-2xl font-bold header text-center">
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

      {results.length > 0 && (
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Showing {results.length} result{results.length === 1 ? "" : "s"}
        </div>
      )}

      {results.length > 0 && (
        <div className="p-4 rounded flex flex-wrap justify-center gap-4 results">
          {results.map((movie: Movie) => (
            <div key={movie.id} className="movie-card movie text-center border-2 m-5 p-10 gap-x-4 max-w-300">
              <Link className='flex justify-center' href={`https://www.themoviedb.org/movie/${movie.id}`} target="_blank">
                <img src={movie.poster_path} alt={`poster for ${movie.title}`} width={200} className="movie-card movie-poster flex justify-center"/>
              </Link>
              <Link href={`https://www.themoviedb.org/movie/${movie.id}`} target="_blank">
                <h1 className="movie-card movie-title">
                  {movie.title}
                </h1>
              </Link>
              <h1 className="movie-card movie-year">
                ({movie.year})
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
