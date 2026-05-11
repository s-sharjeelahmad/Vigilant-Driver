import { useMemo, useState, useRef, useEffect } from "react";
import { Send, Sparkles, User, Bot, AlertCircle } from "lucide-react";
import { companyApi } from "../lib/apiClient";

function CompanyAIAdvisorPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const suggestions = useMemo(
    () => [
      "What does the system monitor?",
      "How do I manage driver risk scores?",
      "Where can I view active sessions?",
      "Explain the severity levels of alerts."
    ],
    []
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

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
        { role: "assistant", text: "Sorry, I am currently unable to process your request. Please try again later.", isError: true }
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleSuggestion = (text) => {
    setInput(text);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      <div className="page-header" style={{ marginBottom: '1.5rem', flexShrink: 0 }}>
        <div>
          <h1 className="ds-heading-1" style={{ margin: 0, color: 'var(--color-text-primary)' }}>AI Safety Advisor</h1>
          <p className="ds-body" style={{ margin: '0.25rem 0 0 0' }}>Intelligent assistant for platform navigation, safety protocols, and operations.</p>
        </div>
      </div>

      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
        
        {/* Chat Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'var(--color-bg)' }}>
          
          {messages.length === 0 && (
            <div style={{ margin: 'auto', textAlign: 'center', maxWidth: '600px' }}>
              <div style={{ display: 'inline-flex', padding: '1rem', background: 'var(--color-surface)', borderRadius: '50%', boxShadow: 'var(--shadow-low)', marginBottom: '1.5rem' }}>
                <Sparkles size={32} color="var(--color-primary)" />
              </div>
              <h2 className="ds-heading-2" style={{ marginBottom: '1rem' }}>How can I help you manage your fleet?</h2>
              <p className="ds-body" style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
                I can explain safety metrics, help you navigate the dashboard, or clarify how driver alerts and risk scoring work.
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                {suggestions.map((text) => (
                  <button 
                    key={text} 
                    type="button" 
                    onClick={() => handleSuggestion(text)}
                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '1rem', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', boxShadow: 'var(--shadow-low)' }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <span className="ds-body" style={{ fontWeight: 500 }}>"{text}"</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: m.role === 'user' ? 'row-reverse' : 'row', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ flexShrink: 0, width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: m.role === 'user' ? 'var(--color-text-primary)' : 'var(--color-primary)', color: 'white' }}>
                {m.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div style={{ 
                maxWidth: '75%', 
                padding: '1rem 1.25rem', 
                borderRadius: '12px',
                borderTopLeftRadius: m.role === 'user' ? '12px' : '2px',
                borderTopRightRadius: m.role === 'user' ? '2px' : '12px',
                background: m.role === 'user' ? 'var(--color-surface)' : m.isError ? 'rgba(218, 30, 40, 0.1)' : 'var(--color-surface)',
                border: `1px solid ${m.isError ? 'var(--color-error)' : 'var(--color-border)'}`,
                boxShadow: 'var(--shadow-low)'
              }}>
                {m.isError && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-error)', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.875rem' }}><AlertCircle size={16} /> Error</div>}
                <div className="ds-body" style={{ margin: 0, color: m.isError ? 'var(--color-error)' : 'var(--color-text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{m.text}</div>
              </div>
            </div>
          ))}

          {sending && (
             <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem', alignItems: 'flex-start' }}>
             <div style={{ flexShrink: 0, width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-primary)', color: 'white' }}>
               <Bot size={20} />
             </div>
             <div style={{ 
               padding: '1rem 1.5rem', 
               borderRadius: '12px', borderTopLeftRadius: '2px',
               background: 'var(--color-surface)', border: '1px solid var(--color-border)',
               display: 'flex', gap: '0.4rem', alignItems: 'center'
             }}>
               <span style={{ width: '6px', height: '6px', background: 'var(--color-text-muted)', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
               <span style={{ width: '6px', height: '6px', background: 'var(--color-text-muted)', borderRadius: '50%', animation: 'pulse 1.5s infinite 0.2s' }} />
               <span style={{ width: '6px', height: '6px', background: 'var(--color-text-muted)', borderRadius: '50%', animation: 'pulse 1.5s infinite 0.4s' }} />
             </div>
           </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding: '1.5rem', background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', gap: '1rem', maxWidth: '1000px', margin: '0 auto', position: 'relative' }}>
            <textarea
              rows={1}
              placeholder="Ask the AI Advisor..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              disabled={sending}
              style={{ flex: 1, padding: '1rem', paddingRight: '4rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)', outline: 'none', resize: 'none', fontSize: '1rem', fontFamily: 'inherit', transition: 'border-color 0.2s' }}
              onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
            />
            <button 
              onClick={sendMessage} 
              disabled={sending || !input.trim()}
              style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: input.trim() && !sending ? 'var(--color-primary)' : 'var(--color-divider)', color: 'white', border: 'none', width: '40px', height: '40px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() && !sending ? 'pointer' : 'not-allowed', transition: 'background 0.2s' }}
            >
              <Send size={18} />
            </button>
          </div>
          <div className="ds-caption" style={{ textAlign: 'center', marginTop: '0.75rem', color: 'var(--color-text-muted)' }}>
            AI Advisor uses strictly internal documentation to provide accurate operational guidance.
          </div>
        </div>

      </div>
      
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}

export default CompanyAIAdvisorPage;
