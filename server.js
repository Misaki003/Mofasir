const express = require('express');
const {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
} = require('@google/generative-ai');


const app = express();
const port = process.env.PORT || 4000;
const apiKey = "AIzaSyARhBRczxq06S5fQojxvoGvInuqJrR3GQk"; // Replace with your actual API key
const genAI = new GoogleGenerativeAI(apiKey);

const instructions = "انت مفسر أحلام";

async function initializeModel() {
    try {
        const model = await genAI.getGenerativeModel({
            model: 'gemini-1.5-pro',
            systemInstruction: instructions,
        });
        return model;
    } catch (error) {
        console.error('Error initializing model:', error);
        throw error; // Ensure errors are propagated if model fails to initialize
    }
}

async function startServer() {
    try {
        const model = await initializeModel();

        const generationConfig = {
            temperature: 1,
            topP: 0.95,
            topK: 64,
            maxOutputTokens: 8192,
            responseMimeType: 'text/plain',
        };

        const safetySettings = [
            {
                category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold: HarmBlockThreshold.BLOCK_NONE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold: HarmBlockThreshold.BLOCK_NONE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold: HarmBlockThreshold.BLOCK_NONE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold: HarmBlockThreshold.BLOCK_NONE,
            },
        ];

        let chatHistory = [];

        app.use(express.static('public'));
        app.use(express.json());

        app.post('/sendMessage', async (req, res) => {
            const userInput = req.body.message;

            chatHistory.push({ role: 'user', parts: [{ text: userInput }] });

            try {
                const chatSession = model.startChat({
                    generationConfig,
                    safetySettings,
                    history: chatHistory,
                });

                const result = await chatSession.sendMessage(userInput);
                const botResponse = result.response.text();
                chatHistory.push({ role: 'model', parts: [{ text: botResponse }] });

                res.json({ response: botResponse });
            } catch (error) {
                console.error('Error sending message:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });

        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1); // Exit the process with a failure code if initialization fails
    }
}

startServer();
