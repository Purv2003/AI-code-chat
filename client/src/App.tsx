import { useState, useRef, useEffect } from "react";
interface Message {
role: "user" | "assistant";
content: string;
}
function App() {
const [messages, setMessages] = useState<Message[]>([]);
const [input, setInput] = useState("");
const [isLoading, setIsLoading] = useState(false);
const messagesEndRef = useRef<HTMLDivElement>(null);
useEffect(() => {
messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages]);
const sendMessage = async () => {
if (!input.trim() || isLoading) return;
const userMessage = input.trim();
setInput("");
setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
setIsLoading(true);
setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
try {
const response = await fetch("http://localhost:3001/api/chat/stream", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ message: userMessage }),
});
const reader = response.body!.getReader();
const decoder = new TextDecoder();
while (true) {
const { done, value } = await reader.read();
if (done) break;
const chunk = decoder.decode(value);
const lines = chunk.split("\n");
for (const line of lines) {
if (line.startsWith("data: ")) {
const data = line.slice(6);
if (data === "[DONE]") break;
try {
const parsed = JSON.parse(data);
if (parsed.text) {
setMessages((prev) => {
const updated = [...prev];
updated[updated.length - 1] = {
role: "assistant",
content: updated[updated.length - 1].content + parsed.text,
};
return updated;
});
}
} catch {}
}
}
}
} catch (error) {
setMessages((prev) => {
const updated = [...prev];
updated[updated.length - 1] = {
role: "assistant",
content: "Something went wrong. Please try again.",
};
return updated;
});
} finally {
setIsLoading(false);
}
};
return (
<div style={styles.container}>
<div style={styles.header}>
<h1 style={styles.title}>AI Code Assistant</h1>
<p style={styles.subtitle}>
Paste your code and ask questions -- powered by Groq
</p>
</div>
<div style={styles.messagesContainer}>
{messages.length === 0 && (
<div style={styles.placeholder}>
<p>Start by pasting some code and asking a question.</p>
<p style={styles.hint}>
Try: "What does this function do?" or "How can I improve this?"
</p>
</div>
)}
{messages.map((msg, index) => (
<div
key={index}
style={{
...styles.message,
...(msg.role === "user" ? styles.userMessage : styles.aiMessage),
}}
>
<div style={styles.messageRole}>
{msg.role === "user" ? "You" : "Groq AI"}
</div>
<div style={styles.messageContent}>
{msg.content || (isLoading && index === messages.length - 1
? "Thinking..."
: "")}
</div>
</div>
))}
<div ref={messagesEndRef} />
</div>
<div style={styles.inputContainer}>
<textarea
style={styles.textarea}
value={input}
onChange={(e) => setInput(e.target.value)}
onKeyDown={(e) => {
if (e.key === "Enter" && !e.shiftKey) {
e.preventDefault();
sendMessage();
}
}}
placeholder="Paste code or ask a question... (Shift+Enter for new line, Enter to send)"
rows={4}
/>
<button
style={{
...styles.button,
...(isLoading ? styles.buttonDisabled : {}),
}}
onClick={sendMessage}
disabled={isLoading}
>
{isLoading ? "..." : "Send"}
</button>
</div>
</div>
);
}
const styles: { [key: string]: React.CSSProperties } = {
container: {
maxWidth: "800px",
margin: "0 auto",
height: "100vh",
display: "flex",
flexDirection: "column",
fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
background: "#0f172a",
color: "#e2e8f0",
},
header: {
padding: "20px 24px",
borderBottom: "1px solid #1e293b",
},
title: { margin: 0, fontSize: "20px", color: "#f8fafc" },
subtitle: { margin: "4px 0 0", fontSize: "13px", color: "#64748b" },
messagesContainer: {
flex: 1,
overflowY: "auto",
padding: "16px 24px",
display: "flex",
flexDirection: "column",
gap: "16px",
},
placeholder: {
textAlign: "center",
color: "#475569",
marginTop: "60px",
lineHeight: 1.8,
},
hint: { fontSize: "13px", color: "#334155" },
message: {
padding: "12px 16px",
borderRadius: "8px",
maxWidth: "90%",
},
userMessage: {
background: "#1e293b",
alignSelf: "flex-end",
border: "1px solid #334155",
},
aiMessage: {
background: "#0f2027",
alignSelf: "flex-start",
border: "1px solid #164e63",
},
messageRole: { fontSize: "11px", color: "#64748b", marginBottom: "6px" },
messageContent: {
fontSize: "14px",
lineHeight: 1.7,
whiteSpace: "pre-wrap",
},
inputContainer: {
padding: "16px 24px",
borderTop: "1px solid #1e293b",
display: "flex",
gap: "12px",
alignItems: "flex-end",
},
textarea: {
flex: 1,
padding: "12px",
background: "#1e293b",
border: "1px solid #334155",
borderRadius: "8px",
color: "#e2e8f0",
fontSize: "14px",
resize: "none",
fontFamily: "inherit",
outline: "none",
},
button: {
padding: "12px 20px",
background: "#3b82f6",
color: "white",
border: "none",
borderRadius: "8px",
cursor: "pointer",
fontSize: "14px",
fontWeight: 600,
minWidth: "60px",
},
buttonDisabled: {
background: "#1e3a5f",
cursor: "not-allowed",
},
};
export default App;