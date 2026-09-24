import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { GoogleGenAI } from "@google/genai";
import "./AIDoubtSolver.css";

function AIDoubtSolver() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAsk = async (e) => {
    e.preventDefault();

    if (!question.trim()) {
      return;
    }

    setLoading(true);
    setAnswer("");
    setError("");

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

      if (!apiKey) {
        throw new Error(
          "Gemini API key not found. Check your .env file."
        );
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey
      });

      let response = null;

      // Try up to 3 times if Gemini is temporarily unavailable
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          response = await ai.models.generateContent({
            model: "gemini-3.6-flash",

            contents: `You are an AI placement tutor for a college student preparing for technical placements.

Your job is to explain the student's doubt clearly, simply, and in a structured way.

IMPORTANT:
- Do not give one long paragraph.
- Use short paragraphs.
- Use headings and bullet points.
- Choose the answer structure based on the type of question.
- Do not unnecessarily repeat the student's question.

For DSA or programming questions, use this structure when appropriate:

## 🧠 Concept
Give a short and simple definition.

## 🔍 Approach
Explain the main idea in simple words.

## 🪜 Step-by-step
Explain the logic using numbered steps.

## 💡 Example
Give a small and easy example.

## 💻 Code
If code is required, provide clean code and explain the important parts.

## 🧪 Dry Run
If useful, show how the code works with the example.

## ⏱️ Complexity
Give time and space complexity when applicable.

## 🎯 Key Takeaway
End with the most important point to remember.

For theory questions such as DBMS, OS, CN, OOP, or SQL:
- Start with a simple definition.
- Explain the concept in small sections.
- Give a practical example.
- Mention important interview points.
- End with a short key takeaway.

For comparison questions:
- Use a simple table when appropriate.
- Explain when each option is useful.
- Mention important interview points.

For interview questions:
- Give a clear interview-ready answer.
- Then explain it in beginner-friendly language.
- Include a short example when useful.

For SQL questions:
- Explain the concept.
- Give the SQL syntax when applicable.
- Give a small example query.
- Explain the query.
- Mention important interview points.

Keep answers focused and avoid unnecessary information.

Student's question:
${question}`
          });

          // If successful, stop retrying
          break;

        } catch (error) {
          console.error(
            `AI attempt ${attempt} failed:`,
            error
          );

          // Retry only for temporary 503 errors
          if (error?.status !== 503 || attempt === 3) {
            throw error;
          }

          // Wait before retrying
          const delay = attempt * 2000;

          await new Promise((resolve) =>
            setTimeout(resolve, delay)
          );
        }
      }

      if (!response || !response.text) {
        throw new Error(
          "No answer was received from Gemini."
        );
      }

      setAnswer(response.text);

    } catch (error) {
      console.error("AI Error:", error);

      setError(
        error?.message ||
        "Something went wrong while getting the AI response."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-doubt-page">

      <div className="ai-doubt-header">
        <div>
          <h1>AI Doubt Solver</h1>

          <p>
            Ask questions and get help with your placement preparation.
          </p>
        </div>
      </div>


      <div className="ai-doubt-container">

        <div className="ai-welcome">

          <div className="ai-icon">
            🤖
          </div>

          <h2>
            How can I help you?
          </h2>

          <p>
            Ask doubts about DSA, Java, DBMS, SQL, OOP,
            Operating Systems, Computer Networks, or interviews.
          </p>

        </div>


        <div className="ai-suggestions">

          <button
            type="button"
            onClick={() =>
              setQuestion(
                "Explain BFS and DFS with a simple example."
              )
            }
          >
            Explain BFS and DFS
          </button>


          <button
            type="button"
            onClick={() =>
              setQuestion(
                "What is normalization in DBMS?"
              )
            }
          >
            Explain DBMS normalization
          </button>


          <button
            type="button"
            onClick={() =>
              setQuestion(
                "What is the difference between an ArrayList and LinkedList in Java?"
              )
            }
          >
            Java interview doubt
          </button>


          <button
            type="button"
            onClick={() =>
              setQuestion(
                "Give me some important SQL interview questions."
              )
            }
          >
            SQL interview questions
          </button>

        </div>


        <form
          className="ai-question-form"
          onSubmit={handleAsk}
        >

          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask your doubt..."
            rows="4"
          />


          <div className="ai-input-footer">

            <span>
              Ask anything related to placement preparation
            </span>


            <button
              type="submit"
              disabled={!question.trim() || loading}
            >
              {loading ? "Thinking..." : "Ask AI"}
            </button>

          </div>

        </form>


        {error && (
          <div className="ai-error">
            {error}
          </div>
        )}


        {answer && (
          <div className="ai-answer">

            <div className="ai-answer-title">
              🤖 AI Answer
            </div>

            <div className="ai-answer-content">
  <ReactMarkdown>
    {answer}
  </ReactMarkdown>
</div>

          </div>
        )}

      </div>
    </div>
  );
}

export default AIDoubtSolver;