import React, { useState, useRef, useEffect } from 'react';
import type { Chat } from '@google/genai';
// Removed the static import of GoogleGenAI to use dynamic import instead.
import { ChatBubbleIcon, XIcon, SendIcon, RobotIcon, SpinnerIcon } from './icons';

type Message = {
    role: 'user' | 'model';
    content: string;
}

export const Chatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [chat, setChat] = useState<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // FIX: Use a dynamic import for the @google/genai library.
    // This defers the loading of the entire SDK until the chatbot is actually opened by the user.
    // This is the most robust way to prevent any module-level issues from crashing the main application on load.
    useEffect(() => {
        if (isOpen && !chat) {
            import('@google/genai').then(({ GoogleGenAI }) => {
                try {
                    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                    const chatSession = ai.chats.create({ model: 'gemini-2.5-flash' });
                    setChat(chatSession);
                    setError(null);
                } catch (e) {
                    console.error("Failed to initialize Gemini:", e);
                    setError("Could not initialize AI Assistant.");
                }
            }).catch(e => {
                 console.error("Failed to load @google/genai module:", e);
                 setError("Could not load AI Assistant module.");
            });
        }
    }, [isOpen]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(scrollToBottom, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !chat) return;

        const userMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);

        try {
            const response = await chat.sendMessage({ message: currentInput });
            const botResponse = response.text;
            setMessages(prev => [...prev, { role: 'model', content: botResponse }]);
        } catch (error) {
            console.error("Error fetching response from Gemini:", error);
            setMessages(prev => [...prev, { role: 'model', content: "Sorry, I'm having trouble connecting right now." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-8 right-8 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 z-50"
                aria-label="Toggle Chatbot"
            >
                {isOpen ? <XIcon className="w-6 h-6" /> : <ChatBubbleIcon className="w-6 h-6" />}
            </button>

            {isOpen && (
                <div className="fixed bottom-24 right-8 w-full max-w-sm bg-white rounded-xl shadow-2xl flex flex-col h-[60vh] z-40 animate-fade-in-up">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-200 bg-slate-50 rounded-t-xl flex items-center gap-3">
                        <RobotIcon className="w-6 h-6 text-indigo-600" />
                        <h3 className="font-bold text-lg text-gray-800">PulseHR Assistant</h3>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0"><RobotIcon className="w-5 h-5 text-indigo-600" /></div>}
                                <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-100 text-gray-800 rounded-bl-none'}`}>
                                    <p className="text-sm">{msg.content}</p>
                                </div>
                            </div>
                        ))}
                         {isLoading && (
                            <div className="flex gap-3 justify-start">
                               <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0"><RobotIcon className="w-5 h-5 text-indigo-600" /></div>
                               <div className="max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl bg-slate-100 text-gray-800 rounded-bl-none flex items-center">
                                    <SpinnerIcon className="w-5 h-5 text-indigo-500 animate-spin" />
                                    <p className="text-sm ml-2 text-gray-500">thinking...</p>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-gray-200 bg-white rounded-b-xl">
                        {error ? (
                            <div className="text-center text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>
                        ) : (
                            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask a question..."
                                    className="flex-1 px-4 py-2 bg-white border border-slate-300 rounded-full text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading || !chat}
                                    className="bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    <SendIcon className="w-5 h-5" />
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};
