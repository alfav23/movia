import { NextRequest, NextResponse } from 'next/server';

export type Movie = {
  id: number
  poster_path: string
  title: string
  year: string
  synopsis: string
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
  return data.results.map((movie: Movie) => ({
    id: movie.id,
    poster_path: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
    title: movie.title,
    year: movie.year,
    synopsis: movie.synopsis
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
                "type": "string",
                "description": "Movie release year"
              },
              "synopsis": {
                "type": "string",
                "description": "A short summary of the movie"
              }
            },
            "required": ["id", "poster_path", "title", "year", "synopsis"],
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
      provider: {
        require_parameters: true,
      },
      stream: false,
    };

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    // Check if the model called any tools
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
        provider: {
          require_parameters: true,
        },
        stream: false,
      };

      const followUpResponse = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(followUpPayload)
      });

      const followUpData = await followUpResponse.json();
      console.log(followUpData.choices[0].message.content);
      const movieContent = JSON.parse(followUpData.choices[0].message.content);
      return NextResponse.json({ results: [movieContent] });
    }

    // If no tools were called, return the initial response
    const movieContent = JSON.parse(data.choices[0].message.content);
    return NextResponse.json({ results: [movieContent] });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to search for movies' },
      { status: 500 }
    );
  }
}


