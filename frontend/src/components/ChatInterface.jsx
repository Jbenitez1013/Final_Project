import React, { useState, useEffect } from 'react';

const ChatInterface = () => {
    const [messages, setMessages] = useState([]); // Stores the chat history
    const [input, setInput] = useState(""); // Stores the current user input
    const [loading, setLoading] = useState(false); // Tracks the loading state
    const [uploading, setUploading] = useState(false); // Tracks the PDF upload state
    const [error, setError] = useState(""); // Stores error messages, if any
    const [uploadedPdfContent, setUploadedPdfContent] = useState(""); // Stores extracted PDF content

    // Form state
    const [formName, setFormName] = useState("");
    const [formEmail, setFormEmail] = useState("");
    const [formMessage, setFormMessage] = useState("");
    const [formSuccess, setFormSuccess] = useState(false);

    // Fetch stored conversations on component load
    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const response = await fetch('http://localhost:5001/conversations');
                const data = await response.json();
                const formattedMessages = data.map((conv) => ({
                    user: conv.user_message,
                    fee: conv.fee_response,
                }));
                setMessages(formattedMessages);
                console.log("[INFO] Fetched stored conversations:", formattedMessages);
            } catch (error) {
                console.error("[ERROR] Failed to fetch conversations:", error);
                setError("Failed to fetch stored conversations.");
            }
        };

        fetchConversations();
    }, []);

    const sendMessage = async () => {
        if (!input.trim()) return; // Prevent empty messages
        if (!uploadedPdfContent && input.toLowerCase().includes("pdf")) {
            setError("Please upload a PDF before asking about its content.");
            return;
        }
        setLoading(true);
        setError(""); // Clear previous errors

        try {
            console.log("[DEBUG] Sending message to backend:", input);
            console.log("[DEBUG] PDF Content sent with message:", uploadedPdfContent || "No PDF uploaded");

            // Send user input and PDF content (if available) to the backend
            const response = await fetch('http://localhost:5001/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: input,
                    pdfContent: uploadedPdfContent, // Send PDF content if available
                }),
            });

            const data = await response.json();

            if (response.ok && data.reply) {
                setMessages([...messages, { user: input, fee: data.reply }]); // Add to chat history
                setInput(""); // Clear the input field
            } else {
                throw new Error(data.error || "Unexpected error occurred.");
            }
        } catch (error) {
            console.error("[ERROR] Error sending message:", error);
            setError("Failed to communicate with Fee. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handlePdfUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setError(""); // Clear any previous errors

        const formData = new FormData();
        formData.append('file', file);

        try {
            console.log("[DEBUG] Uploading PDF file:", file.name);
            const response = await fetch('http://localhost:5001/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (response.ok && data.content) {
                setUploadedPdfContent(data.content); // Store extracted PDF content
                setMessages([]); // Clear chat history on new PDF upload
                setError(""); // Clear any previous errors
                console.log("[DEBUG] Extracted PDF Content:", data.content);
            } else {
                throw new Error(data.message || "Failed to process the uploaded PDF.");
            }
        } catch (error) {
            console.error("[ERROR] Error uploading PDF:", error);
            setError("Failed to upload and process the PDF. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();

        if (!formName || !formEmail || !formMessage) {
            setError("All form fields are required.");
            return;
        }

        try {
            const response = await fetch('http://localhost:5001/submit-form', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formName,
                    email: formEmail,
                    message: formMessage,
                }),
            });

            if (response.ok) {
                setFormSuccess(true);
                setFormName("");
                setFormEmail("");
                setFormMessage("");
                console.log("[INFO] Form submitted successfully!");
            } else {
                throw new Error("Failed to submit form.");
            }
        } catch (error) {
            console.error("[ERROR] Failed to submit form:", error);
            setError("Failed to submit form. Please try again.");
        }
    };

    return (
        <div className="p-4 max-w-2xl mx-auto bg-gray-900 text-white rounded-lg shadow-lg">
            <h2 className="text-3xl font-bold mb-4 text-center text-blue-400">Chat with Fee</h2>

            {/* PDF Upload Section */}
            <div className="mb-6">
                <label className="block mb-2 font-medium text-blue-300">Upload a PDF for Fee to analyze:</label>
                <input
                    type="file"
                    accept="application/pdf"
                    onChange={handlePdfUpload}
                    className="border border-blue-500 rounded p-2 w-full bg-gray-800 text-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={uploading}
                />
                {uploading && <p className="text-blue-400 mt-2">Uploading and processing PDF...</p>}
                {uploadedPdfContent && (
                    <p className="text-green-400 mt-2">PDF uploaded and processed successfully!</p>
                )}
            </div>

            {/* Chat Window */}
            <div className="chat-window bg-gray-800 p-4 rounded shadow-lg h-96 overflow-y-auto">
                {messages.map((msg, index) => (
                    <div key={index} className="mb-4">
                        <p>
                            <strong className="text-blue-300">You:</strong> {msg.user}
                        </p>
                        <p>
                            <strong className="text-green-400">Fee:</strong> {msg.fee}
                        </p>
                    </div>
                ))}
                {loading && <p className="text-blue-400">Fee is typing...</p>}
            </div>

            {/* Input and Send Button */}
            <div className="mt-4">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message here..."
                    className="border border-blue-500 rounded p-2 w-full bg-gray-800 text-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                />
                <button
                    onClick={sendMessage}
                    className={`bg-blue-500 text-white p-2 mt-2 rounded w-full ${
                        loading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600"
                    }`}
                    disabled={loading}
                >
                    {loading ? "Sending..." : "Send"}
                </button>
            </div>

            {/* Form Section */}
            <div className="mt-8">
                <h3 className="text-xl font-bold mb-4 text-blue-400">Submit Your Details</h3>
                <form onSubmit={handleFormSubmit}>
                    <input
                        type="text"
                        placeholder="Name"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className="border border-blue-500 rounded p-2 w-full mb-2 bg-gray-800 text-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        className="border border-blue-500 rounded p-2 w-full mb-2 bg-gray-800 text-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <textarea
                        placeholder="Message"
                        value={formMessage}
                        onChange={(e) => setFormMessage(e.target.value)}
                        className="border border-blue-500 rounded p-2 w-full mb-2 bg-gray-800 text-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    ></textarea>
                    <button
                        type="submit"
                        className="bg-green-500 text-white p-2 mt-2 rounded w-full hover:bg-green-600"
                    >
                        Submit
                    </button>
                </form>
                {formSuccess && (
                    <p className="text-green-400 mt-4">Form submitted successfully!</p>
                )}
            </div>

            {/* Error Display */}
            {error && (
                <div className="text-red-400 mt-4">
                    <strong>Error:</strong> {error}
                </div>
            )}
        </div>
    );
};

export default ChatInterface;
