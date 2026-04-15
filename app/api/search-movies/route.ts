import { NextRequest, NextResponse } from 'next/server';

interface Movie {
  id: number;
  title: string;
  year: string;
}

type Message = {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  tool_call_id?: string;  // Optional for tool messages
};

async function searchIMDb(searchTerms: string[]): Promise<Movie[]> {
  const searchQuery = searchTerms.join(' ');
  const url = 'https://api.themoviedb.org/3/search/movie';
  const headers = {
      "Authorization": `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
      "Content-Type": "application/json"
    };
  const response = await fetch(`${url}?query=${searchQuery}`, { 
    headers 
  });
  const data = await response.json();
  return data.results.map((movie: any) => ({
    id: movie.id,
    title: movie.title,
    year: movie.year,
  }));
}

const tools = [
  { "type": "openrouter:web_search", "parameters": { "max_results": 3 } },
  {
    type: 'function',
    function: {
      id: 0,
      name: 'searchIMDb',
      description: 'Search for movies on IMDb',
      strict: null,
      parameters: {
        type: 'object',
        properties: {
          search_terms: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: "List of search terms to find movies in IMDb",
          },
        },
        required: ['search_terms'],
      },
    },
  },
];

const TOOL_MAPPING = {
  searchIMDb,
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
        "role": "system",
        "content": "You are an AI assistant. You suggest movies to users based on one-word key words. Your output should only provide movie title, year of release, and a short synopsis."
      },
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
          "type": "object",
          "properties": {
            "title": {
              "type": "string",
              "description": "Movie name"
            },
            "year": {
              "type": "string",
              "description": "Movie release date"
            },
            "synopsis": {
              "type": "string",
              "description": "A short summary"
            }
          },
          "required": ["title", "year", "synopsis"],
          "additionalProperties": false
        }
      }
    }


    const url = "https://openrouter.ai/api/v1/chat/completions";
    const headers = {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json"
    };
    const payload = {
      "model": "openai/gpt-oss-20b:free@preset/movie-suggester",
      messages,
      responseFormat,
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
        model: "openai/gpt-oss-20b:free@preset/movie-suggester",
        messages,
        responseFormat,
        stream: false,
      };

      const followUpResponse = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(followUpPayload)
      });

      const followUpData = await followUpResponse.json();
      return NextResponse.json(followUpData);
    }

    // If no tools were called, return the initial response
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to search for movies' },
      { status: 500 }
    );
  }
}


