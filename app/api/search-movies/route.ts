import { NextRequest, NextResponse } from 'next/server';

export type Movie = {
  id: number
  poster_path: string
  title: string
  year: number
  overview: string
}

type Message = {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  tool_call_id?: string;  // Optional for tool messages
};

async function searchTMDB(searchTerms: string[]): Promise<Movie[]> {
  const searchQuery = searchTerms.join(' ');
  const url = 'https://api.themoviedb.org/3/search/movie';
  const headers = {
      "Authorization": `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
      "Content-Type": "application/json"
    };
  const response = await fetch(`${url}?query=${searchQuery}`, { 
    headers 
  });
  if (!response.ok) {
    console.error(response.body);
    return [];
  }
  const data = await response.json();
  //check for results error
  console.log("TMDB data:" + JSON.stringify(data));
  return data.results.map((movie: any) => ({
    id: movie.id,
    poster_path: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
    title: movie.title,
    year: (new Date(movie.release_date)).getFullYear(),
    overview: movie.overview
  }));
}

const tools = [
  { "type": "openrouter:web_search", "parameters": { "max_results": 3 } },
  {
    type: 'function',
    function: {
      id: 0,
      name: 'searchTMDB',
      description: 'Search for movies on TMDB using relevant terms and keywords',
      strict: null,
      parameters: {
        type: 'object',
        properties: {
          search_terms: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: "List of search terms to find movies in TMDB",
          },
        },
        required: ['search_terms'],
      },
    },
  },
];

const TOOL_MAPPING = {
  searchTMDB,
};



export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const messages: Message[] = [
      {
        "role": "user",
        "content": `${query}`
      }
    ];

    const responseFormat = {
      "type": "json_schema",
      "json_schema": {
        "name": "movies",
        "strict": true,
        "schema": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": {
                "type": "number",
                "description": "TMDB movie id"
              },
              "poster_path": {
                "type": "string",
                "description": "TMDB movie poster URL"
              },
              "title": {
                "type": "string",
                "description": "Movie name"
              },
              "year": {
                "type": "number",
                "description": "Movie release year"
              },
              "overview": {
                "type": "string",
                "description": "A short summary of the movie"
              }
            },
            "required": ["id", "poster_path", "title", "year", "overview"],
            "additionalProperties": false
          }
        }
      }
    }


    const url = "https://openrouter.ai/api/v1/chat/completions";
    const headers = {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json"
    };
    const payload = {
      "model": "nvidia/nemotron-3-super-120b-a12b:free@preset/movie-suggester",
      messages,
      response_format: responseFormat,
      plugins: [
        { id: 'response-healing' }
      ],
      tools,
      stream: false,
    };

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    if (!response.ok) {
      console.error("OpenRouter request failed:", response.status, responseText);
      return NextResponse.json(
        { error: 'OpenRouter request failed', details: responseText },
        { status: response.status }
      );
    }

    const data = JSON.parse(responseText);
    console.log("Model response 1:" + JSON.stringify(data));

    if (data.error) {
      console.error("OpenRouter response error:", JSON.stringify(data.error));
      return NextResponse.json(
        { error: 'OpenRouter response error', details: data.error },
        { status: 500 }
      );
    }

    if (data.choices && data.choices[0].message.tool_calls) {
      // Add the assistant's message with tool calls to messages
      messages.push(data.choices[0].message);

      // Execute each tool call
      for (const toolCall of data.choices[0].message.tool_calls) {
        const toolName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);
        const toolResponse = await TOOL_MAPPING[toolName as keyof typeof TOOL_MAPPING](args.search_terms);
        
        // Add tool response to messages
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolResponse),
        });
      }

      // Make a follow-up request with the tool results
      const followUpPayload = {
        model: "nvidia/nemotron-3-super-120b-a12b:free@preset/movie-suggester",
        messages,
        response_format: responseFormat,
        stream: false,
      };

      const followUpResponse = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(followUpPayload)
      });

      const followUpText = await followUpResponse.text();
      if (!followUpResponse.ok) {
        console.error("OpenRouter follow-up request failed:", followUpResponse.status, followUpText);
        return NextResponse.json(
          { error: 'OpenRouter follow-up request failed', details: followUpText },
          { status: followUpResponse.status }
        );
      }

      const followUpData = JSON.parse(followUpText);
      if (followUpData.error) {
        console.error("OpenRouter follow-up response error:", JSON.stringify(followUpData.error));
        return NextResponse.json(
          { error: 'OpenRouter follow-up response error', details: followUpData.error },
          { status: 500 }
        );
      }

      console.log("Model response 2 with tool call" + followUpData.choices[0].message.content);
      const movieContent = JSON.parse(followUpData.choices[0].message.content);
      return NextResponse.json({ results: movieContent });
    }

    // If no tools were called, return the initial response
    const movieContent = JSON.parse(data.choices[0].message.content);
    return NextResponse.json({ results: movieContent });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to search for movies' },
      { status: 500 }
    );
  }
}


