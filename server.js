// server.js
const express = require("express");
const { redisClient, hf } = require("./config");

const app = express();
app.use(express.json());

const companyInfo = `
Our company, NIKS Corp, is a leading provider of innovative solutions in the tech industry. 
We specialize in AI, machine learning, and cloud computing. Our mission is to deliver 
cutting-edge technology to help businesses achieve their goals.
`;

app.post("/api/message", async (req, res) => {
  const { userId, message } = req.body;

  if (!userId || !message) {
    return res.status(400).json({ error: "User ID and message are required" });
  }

  try {
    // Retrieve conversation history from Redis
    const sessionKey = `chatbot:session:${userId}`;
    let conversationHistory = await redisClient.get(sessionKey);
    conversationHistory = conversationHistory ? JSON.parse(conversationHistory) : [];

    // Prepare the prompt for the model
    const prompt = `${companyInfo}\n\nUser: ${message}\nBot:`;

    // Use the Hugging Face Llama model for inference
    const response = await hf.textGeneration({
      model: "HuggingFaceTB/SmolLM2-1.7B-Instruct",
      inputs: prompt,
      parameters: {
        max_new_tokens: 150,
        temperature: 0.7,
        top_p: 0.9,
      },
    });

    // Extract the bot's response
    const botMessage = response.generated_text.split("Bot:")[1].split("User:")[0].trim();

    // Update conversation history
    conversationHistory.push({ role: "user", content: message });
    conversationHistory.push({ role: "bot", content: botMessage });

    // Keep only the last 10 messages in the conversation history
    if (conversationHistory.length > 20) {
      conversationHistory = conversationHistory.slice(-20);
    }

    await redisClient.set(sessionKey, JSON.stringify(conversationHistory));

    res.json({ response: botMessage });
  } catch (error) {
    console.error("Error processing message:", error);
    res.status(500).json({ error: "Failed to process message" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});