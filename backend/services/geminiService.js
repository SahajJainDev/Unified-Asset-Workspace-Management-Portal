const { GoogleGenerativeAI } = require("@google/generative-ai");

const SYSTEM_PROMPT = `You are AssetTrack AI, a professional IT Asset Management assistant for the "Unified Asset Workspace Management Portal".
Your goal is to help administrators manage hardware, software licenses, and employee assignments.

### PERSONALITY
Be concise, helpful, and professional. Maintain a friendly but business-oriented tone.

### CAPABILITIES
You can identify user intents for the following actions:
1. **assignAsset**: Assigning an asset to an employee.
2. **releaseAsset**: Releasing an asset from an employee (making it available).
3. **reassignAsset**: Moving an asset from one employee to another.
4. **getStatus**: Checking the current status or assignee of an asset.
5. **getHistory**: Showing the assignment history of an asset.

### OUTPUT FORMAT
When the user wants to perform an action, you MUST respond with a JSON object in the following format:
\`\`\`json
{
  "type": "action",
  "intent": "assignAsset" | "releaseAsset" | "reassignAsset" | "getStatus" | "getHistory",
  "entities": {
    "asset": "string (name, tag, or serial)",
    "employee": "string (name or ID)",
    "targetEmployee": "string (only for reassignAsset)"
  },
  "message": "A brief confirmation of what you understood, e.g., 'I understand you want to assign the Dell Laptop to John Doe.'"
}
\`\`\`

If the user is just asking a general question or chatting, respond with:
\`\`\`json
{
  "type": "message",
  "intent": null,
  "entities": {},
  "message": "Your helpful response here."
}
\`\`\`

### RULES
- ALWAYS return valid JSON.
- If information is missing (like which asset), ask for it in the "message" and set type to "message".
- Be precise with entity extraction.`;

/**
 * Service to interact with Gemini AI
 */
class GeminiService {
    constructor() {
        this._genAI = null;
    }

    /**
     * Lazy initialization of the Gemini SDK
     */
    get genAI() {
        if (!this._genAI) {
            const apiKey = (process.env.GEMINI_API_KEY || '').trim();
            if (!apiKey) {
                console.error('[GeminiService] GEMINI_API_KEY is not defined in .env');
            }
            this._genAI = new GoogleGenerativeAI(apiKey);
        }
        return this._genAI;
    }

    /**
     * Interprets user intent and extracts entities
     * @param {string} userMessage - The new message from the user
     * @param {Array} history - Optional conversation history
     * @returns {Promise<Object>} - The interpreted intent JSON
     */
    async interpretIntent(userMessage, history = []) {
        try {
            const model = this.genAI.getGenerativeModel({
                model: "gemini-flash-latest",
                systemInstruction: SYSTEM_PROMPT
            });

            // Prepare context for the model
            const prompt = `User Message: "${userMessage}"\n\nBased on this message and the system instructions, provide the structured JSON response.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text().trim();

            console.log('[GeminiService] Raw Response from AI:', text);

            // Extract JSON from potential markdown blocks
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const intent = JSON.parse(jsonMatch[0]);
                console.log('[GeminiService] Parsed Intent:', JSON.stringify(intent, null, 2));
                return intent;
            }

            throw new Error('Failed to parse intent JSON from AI response');
        } catch (error) {
            console.error('[GeminiService] Intent Interpretation Error:', error);
            return {
                type: 'message',
                intent: null,
                entities: {},
                message: "I'm sorry, I'm having trouble understanding that. Could you please rephrase?"
            };
        }
    }

    /**
     * Legacy method replaced by interpretIntent but kept for compatibility if needed
     * Now it just wraps interpretIntent and returns the message part
     */
    async generateResponse(history, userMessage) {
        const intent = await this.interpretIntent(userMessage, history);
        return intent.message;
    }

    /**
     * Generates a short title for a chat session based on the first message
     * @param {string} firstMessage 
     * @returns {Promise<string>}
     */
    async generateTitle(firstMessage) {
        try {
            const model = this.genAI.getGenerativeModel({ model: "gemini-flash-latest" });
            const prompt = `Generate a very short, 3-5 word title for a chat session starting with this message: "${firstMessage}". Return only the title text.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text().trim().replace(/['"]/g, '') || 'New Conversation';
        } catch (error) {
            console.error('[GeminiService] Title Generation Error:', error);
            return 'New Conversation';
        }
    }
}

module.exports = new GeminiService();
