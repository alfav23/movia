import { NextRequest, NextResponse } from 'next/server';

interface Movie {
  id: number;
  title: string;
  year: string;
}

async function searchIMDb(searchTerms: string[]): Promise<Movie[]> {
  const searchQuery = searchTerms.join(' ');
  const url = 'https://www.imdb.com';
  const response = await fetch(`${url}?search=${searchQuery}`);
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
      name: 'searchIMDb',
      description: 'Search for movies on IMDb',
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

    const messages = [
      {
        "role": "system",
        "content": "You are an AI assistant. You suggest movies to users based on one-word key words. Your output should only provide movie title, year of release, and a short synopsis."
      },
      {
        "role": "user",
        "content": `${query}`
      }
    ];

    const url = "https://openrouter.ai/api/v1/chat/completions";
    const headers = {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json"
    };
    const payload = {
      "model": "openai/gpt-oss-120b:free@preset/movie-suggester",
      messages,
      tools,
      stream: false,
    };

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });

//     messages.push(response);

// for (const toolCall of response.tool_calls) {
//   const toolName = toolCall.function.name;
//   const { search_params } = JSON.parse(toolCall.function.arguments);
//   const toolResponse = await TOOL_MAPPING[searchIMDb](search_params);
//   messages.push({
//     role: 'tool',
//     toolCallId: toolCall.id,
//     name: toolName,
//     content: JSON.stringify(toolResponse),
//   });
// }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to search for movies' },
      { status: 500 }
    );
  }
}


