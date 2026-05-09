import { useMemo, useState } from "react";
import { companyApi } from "../lib/apiClient";

function CompanyAIAdvisorPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const suggestions = useMemo(
    () => [
      "What does the system monitor?",
      "How do company dashboards work?",
      "Where can I view alerts and sessions?",
      "How do drivers use the system?"
    ],
    []
  );

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userText = input.trim();
    const next = [...messages, { role: "user", text: userText }];
    setMessages(next);
    setInput("");
    setSending(true);
    try {
      const res = await companyApi.chatAdvisor({ message: userText });
      setMessages((m) => [...m, { role: "assistant", text: res.reply }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "Sorry — advisor unavailable. Please try again in a moment." }
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleSuggestion = (text) => {
    setInput(text);
  };

  return (
    <section className="ai-page">
      <div className="container container-wide">
        <div className="ai-hero">
          <div>
            <p className="ai-kicker">Company AI Advisor</p>
            <h2>Ask about workflows, alerts, and navigation</h2>
            <p className="ai-subtitle">
              The advisor answers using only the system context to keep guidance accurate and safe.
            </p>
          </div>
          <div className="ai-suggestions">
            {suggestions.map((text) => (
              <button key={text} type="button" onClick={() => handleSuggestion(text)}>
                {text}
              </button>
            ))}
          </div>
        </div>

        <div className="ai-chat-shell">
          <div className="ai-messages">
            {messages.length === 0 && (
              <div className="ai-empty">
                Start a conversation to get guidance on dashboards, alerts, driver sessions, and profiles.
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`ai-message ${m.role}`}>
                <div className="ai-bubble">
                  <div className="ai-role">{m.role === "user" ? "You" : "Advisor"}</div>
                  <div className="ai-text">{m.text}</div>
                </div>
              </div>
            ))}
            {sending && (
              <div className="ai-message assistant">
                <div className="ai-bubble">
                  <div className="ai-role">Advisor</div>
                  <div className="ai-text ai-typing">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="ai-input-row">
            <textarea
              rows={1}
              placeholder="Ask the AI Advisor about the system, navigation, or workflows..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              disabled={sending}
            />
            <button onClick={sendMessage} disabled={sending}>
              {sending ? "Sending" : "Send"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CompanyAIAdvisorPage;
