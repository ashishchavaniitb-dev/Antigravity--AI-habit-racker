const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");

admin.initializeApp();

// Initialize Gemini
// We assume the user will set the GOOGLE_API_KEY in the environment
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "YOUR_PLACEHOLDER_KEY");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });


exports.onJournalCreated = onDocumentCreated("users/{userId}/journals/{journalId}", async (event) => {
    const userId = event.params.userId;
    const journalId = event.params.journalId;
    const journalData = event.data.data();

    const prompt = `You are an expert Habit Coach based strictly on James Clear's 'Atomic Habits'. 
    Review the user's journal entry concerning their habit. 
    Journal Text: "${journalData.text}"
    
    Identify friction points. Provide exactly one paragraph of coaching advice utilizing the Four Laws of Behavior Change (Make it Obvious, Make it Attractive, Make it Easy, Make it Satisfying). 
    Focus heavily on environmental design and reducing friction. Do not use generic motivational fluff. Be actionable and concise.`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const advice = response.text();

        await admin.firestore()
            .doc(`users/${userId}/journals/${journalId}`)
            .update({
                aiInsights: advice.trim()
            });
    } catch (error) {
        console.error("Error generating journal insight:", error);
    }
});

exports.onCoachMessageReceived = onDocumentCreated("users/{userId}/messages/{messageId}", async (event) => {
    const userId = event.params.userId;
    const messageData = event.data.data();

    // Only respond to user messages, prevent infinite loops
    if (messageData.sender !== "user") return;

    const db = admin.firestore();

    try {
        // Build Context Profile
        // 1. Fetch active habits
        const habitsSnapshot = await db.collection(`users/${userId}/habits`).get();
        const habits = [];
        habitsSnapshot.forEach(doc => {
            const data = doc.data();
            habits.push(`${data.name} (Frequency: ${JSON.stringify(data.frequency || {})})`);
        });

        // 2. Fetch past 3 journals
        const journalsSnapshot = await db.collection(`users/${userId}/journals`)
            .orderBy("createdAt", "desc")
            .limit(3)
            .get();
        const journals = [];
        journalsSnapshot.forEach(doc => {
            journals.push(doc.data().text);
        });

        // 3. Compile context
        const contextProfile = `
Active Habits: ${habits.length > 0 ? habits.join(", ") : "None specifically tracked currently."}
Recent Journals: ${journals.length > 0 ? journals.join(" | ") : "No recent journals."}
        `;

        const prompt = `You are a diagnostic Habit Coach strictly following James Clear's "Atomic Habits" methodologies.
The user is talking to you directly.
Your goal is to assess their current situation, ask probing and clarifying questions if they present a struggle, and offer actionable advice specifically focused on environmental design, removing friction, or applying the 4 Laws of Behavior Change.

USER CONTEXT:
${contextProfile}

USER'S MESSAGE: 
"${messageData.text}"

If they are sharing a problem and need an honest evaluation, DO NOT immediately give a solution. Ask 1 or 2 targeted questions first to get to the root cause (e.g., "What was the immediate trigger for you skipping the habit?").
If they have answered your questions, provide concise, actionable coaching. Be direct, professional, and insightful. Do not be overly generic. Keep it to 1-2 short paragraphs.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const aiMessageText = response.text();

        // Write AI response back
        await db.collection(`users/${userId}/messages`).add({
            text: aiMessageText.trim(),
            sender: "ai",
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

    } catch (error) {
        console.error("Error generating coach chat response:", error);
    }
});
