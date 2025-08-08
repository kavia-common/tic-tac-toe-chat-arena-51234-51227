//
// openaiTrashTalkService.js
//
// Provides a function to fetch AI-generated trash talk using OpenAI's completion API.
// The service uses the OpenAI API key found in the environment variable REACT_APP_OPENAI_API_KEY.
//
// Usage: import { getAITrashTalk } from "./openaiTrashTalkService";
//
// PUBLIC_INTERFACE
export async function getAITrashTalk(gameState, lastEvent, customPrompt) {
  /**
   * Requests an AI-generated trash talk message from OpenAI.
   * @param {object} gameState - An object representing the current game state & players.
   * @param {string} lastEvent - Description of the last game event (e.g., "player X placed at (1,2)").
   * @param {string} [customPrompt] - Optional custom prompt string for style/personalization.
   * @returns {Promise<string>} - The AI-generated message text.
   *
   * Securely reads the API key from process.env (in React: process.env.REACT_APP_OPENAI_API_KEY).
   */

  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not set. Please set REACT_APP_OPENAI_API_KEY in your .env file.');
  }

  const basePrompt =
    customPrompt ||
    `You are a playful, sassy AI designed to provide witty "trash talk" for a Tic Tac Toe game, never crossing the line into mean or offensive.
Given the following game state and event, generate a single, clever, concise chat message as if trash talking your opponent, tailored to the situation.

Game State: ${JSON.stringify(gameState)}
Last Event: ${lastEvent}
Trash Talk Response:
`;

  // This uses OpenAI's "chat" API (gpt-3.5-turbo, etc) endpoint
  const endpoint = 'https://api.openai.com/v1/chat/completions';

  const body = {
    model: "gpt-3.5-turbo",
    messages: [
      { 
        role: "system",
        content: "Provide only a witty, playful trash talk message for a Tic Tac Toe match. Never be mean or offensive.",
      },
      {
        role: "user",
        content: basePrompt
      }
    ],
    max_tokens: 32,
    temperature: 0.9,
    n: 1,
    stop: null
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    let errorMsg = "Unknown error";
    try { errorMsg = await response.text(); } catch {}
    throw new Error(`OpenAI API returned error: ${response.status}: ${errorMsg}`);
  }

  const data = await response.json();
  // Get the first reply's 'content'
  return data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content
    ? data.choices[0].message.content.trim()
    : "Oops! AI lost its words.";
}

/**
 * PUBLIC_INTERFACE
 * Usage/Configuration:
 *   - To customize the prompt/style, supply a customPrompt argument.
 *   - The prompt can be tailored to use different personas, languages, or trash talk intensity.
 *   - See: https://platform.openai.com/docs/guides/chat/prompting
 */
