import { PromptLayer } from "promptlayer";

  const promptLayerClient = new PromptLayer({ apiKey: process.env.PROMPT_LAYER_API_KEY, throwOnError: true });

  const response = await promptLayerClient.run({
  promptName: "movia",
  inputVariables: { input: "blue" },
  tags: ["getting-started"],
  metadata: { user_id: "123" }
});

console.log(response)