const { GoogleGenerativeAI } = require("@google/generative-ai");

class AIService {
    constructor() {
        this.genAI = null;
        if (process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY) {
            const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
            this.genAI = new GoogleGenerativeAI(apiKey);
        }
    }

    async generateDraftReply(conversationHistory, customerMessage, customPrompt = null) {
        console.log(`[AI Service] Generating draft for: "${customerMessage}"`);

        // If we have an API Key, use the real Gemini model
        if (this.genAI) {
            try {
                const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

                const fullPrompt = `
                    You are a professional medical operations assistant for "OpsFlow".
                    Your goal is to draft a helpful, professional, and empathetic reply to a patient message.
                    
                    Customer Message: "${customerMessage}"
                    Recent History: ${JSON.stringify(conversationHistory)}
                    Special Instructions: ${customPrompt || "Keep it professional and concise."}
                    
                    Draft a reply that sounds human and helpful. Do not include any brackets or placeholders.
                `;

                const result = await model.generateContent(fullPrompt);
                const response = await result.response;
                return response.text();
            } catch (err) {
                console.error("[AI Service] Gemini Error, falling back to heuristic logic:", err.message);
            }
        }

        // --- FALLBACK HEURISTIC LOGIC (Used if no API key or error) ---
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate thinking

        if (customPrompt) {
            const promptLower = customPrompt.toLowerCase();
            if (promptLower.includes('formal')) return `Dear Valued Customer, Thank you for your inquiry...`;
            if (promptLower.includes('discount')) return `Hi! Thanks for reaching out. Use code OPSFLOW15 for 15% off!`;
        }

        const lowerMsg = customerMessage.toLowerCase();
        if (lowerMsg.includes('price')) return "Our pricing varies based on requirements. Would you like a consultation?";
        if (lowerMsg.includes('time') || lowerMsg.includes('available')) {
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            return `Check our real-time availability here: ${frontendUrl}/book`;
        }

        return "Thank you for reaching out! A member of our team will assist you shortly. Is there anything specific you'd like us to focus on?";
    }

    async analyzeSentiment(message) {
        const lowerMsg = message.toLowerCase();
        if (lowerMsg.includes('urgent') || lowerMsg.includes('help') || lowerMsg.includes('error')) return 'URGENT';
        return 'NORMAL';
    }
}

module.exports = new AIService();
