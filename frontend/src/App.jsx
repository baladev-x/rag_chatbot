import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

import {
  uploadDocument,
  getDocuments,
  deleteDocument,
  sendMessage,
} from "./services/api";

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // ================= LOAD DOCUMENTS =================

  useEffect(() => {
    loadDocuments();
  }, []);

  // ================= AUTO SCROLL =================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  // ================= GET DOCUMENTS =================

  const loadDocuments = async () => {
    try {
      const data = await getDocuments();

      if (data.success) {
        setDocuments(data.documents);
      }
    } catch (error) {
      console.error("Failed to load documents:", error);
    }
  };

  // ================= UPLOAD =================

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploading(true);
    setUploadMessage("");

    try {
      const data = await uploadDocument(file);

      if (data.success) {
        setUploadMessage(
          `"${data.filename}" uploaded successfully. ${data.chunks_created} chunks created.`
        );

        await loadDocuments();
      } else {
        setUploadMessage("Upload failed.");
      }
    } catch (error) {
      console.error("Upload error:", error);

      const message =
        error.response?.data?.detail ||
        "Failed to upload document.";

      setUploadMessage(
        typeof message === "string"
          ? message
          : "Failed to upload document."
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  // ================= DELETE DOCUMENT =================

  const handleDeleteDocument = async (fileId) => {
    try {
      await deleteDocument(fileId);
      await loadDocuments();
    } catch (error) {
      console.error("Delete error:", error);
      setUploadMessage("Failed to delete document.");
    }
  };

  // ================= SEND MESSAGE =================

  const handleSendMessage = async () => {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || loading) {
      return;
    }

    setMessages((previousMessages) => [
      ...previousMessages,
      {
        role: "user",
        content: trimmedQuestion,
      },
    ]);

    setQuestion("");
    setLoading(true);

    try {
      const data = await sendMessage(trimmedQuestion);

      if (data.success) {
        setMessages((previousMessages) => [
          ...previousMessages,
          {
            role: "assistant",
            content: data.answer,
            sources: data.sources || [],
          },
        ]);
      } else {
        setMessages((previousMessages) => [
          ...previousMessages,
          {
            role: "assistant",
            content:
              data.message ||
              "I couldn't find relevant information in the uploaded documents.",
            sources: [],
          },
        ]);
      }
    } catch (error) {
      console.error("Chat error:", error);

      const errorMessage =
        error.response?.data?.detail ||
        "Something went wrong while processing your question.";

      setMessages((previousMessages) => [
        ...previousMessages,
        {
          role: "assistant",
          content:
            typeof errorMessage === "string"
              ? errorMessage
              : "Something went wrong while processing your question.",
          sources: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ================= ENTER KEY =================

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  // ================= NEW CHAT =================

  const handleNewChat = () => {
    setMessages([]);
    setQuestion("");
    setUploadMessage("");
    setMobileSidebarOpen(false);
  };

  // ================= SUGGESTION =================

  const handleSuggestionClick = (text) => {
    setQuestion(text);
  };

  return (
    <div
      className={`h-[100dvh] w-full flex overflow-hidden transition-colors duration-300 ${
        darkMode
          ? "bg-slate-950 text-white"
          : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* =====================================================
          MOBILE OVERLAY
      ===================================================== */}

      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className={`fixed md:relative z-50 md:z-auto inset-y-0 left-0
        w-[280px] sm:w-72 shrink-0 border-r flex flex-col
        transform transition-transform duration-300
        ${
          mobileSidebarOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0"
        }
        ${
          darkMode
            ? "bg-slate-900 border-slate-800"
            : "bg-white border-slate-200"
        }`}
      >
        {/* Logo */}

        <div className="px-5 sm:px-6 py-5 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-lg font-bold ${
                  darkMode
                    ? "bg-white text-slate-900"
                    : "bg-slate-900 text-white"
                }`}
              >
                F
              </div>

              <div className="min-w-0">
                <h1 className="font-bold text-lg truncate">
                  FileMind AI
                </h1>

                <p
                  className={`text-xs ${
                    darkMode
                      ? "text-slate-400"
                      : "text-slate-500"
                  }`}
                >
                  Document Intelligence
                </p>
              </div>
            </div>

            {/* Mobile close */}

            <button
              onClick={() => setMobileSidebarOpen(false)}
              className={`md:hidden w-9 h-9 rounded-lg flex items-center justify-center ${
                darkMode
                  ? "hover:bg-slate-800 text-slate-300"
                  : "hover:bg-slate-100 text-slate-600"
              }`}
            >
              ✕
            </button>
          </div>
        </div>

        {/* New Chat */}

        <div className="px-4">
          <button
            onClick={handleNewChat}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition ${
              darkMode
                ? "bg-white text-slate-900 hover:bg-slate-200"
                : "bg-slate-900 text-white hover:bg-slate-800"
            }`}
          >
            <span className="text-lg">+</span>
            New Chat
          </button>
        </div>

        {/* Documents Header */}

        <div className="px-5 pt-7 pb-3">
          <div className="flex items-center justify-between">
            <h2
              className={`text-xs font-semibold uppercase tracking-wider ${
                darkMode
                  ? "text-slate-400"
                  : "text-slate-500"
              }`}
            >
              Documents
            </h2>

            <span
              className={`text-xs px-2 py-1 rounded-full ${
                darkMode
                  ? "bg-slate-800 text-slate-300"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {documents.length}
            </span>
          </div>
        </div>

        {/* Document List */}

        <div className="flex-1 overflow-y-auto px-4 space-y-2">
          {documents.length === 0 ? (
            <div
              className={`text-center py-8 text-sm ${
                darkMode
                  ? "text-slate-500"
                  : "text-slate-400"
              }`}
            >
              No documents yet.
              <br />
              Upload a document to begin.
            </div>
          ) : (
            documents.map((document) => (
              <div
                key={document.file_id}
                className={`group p-3 rounded-xl border transition ${
                  darkMode
                    ? "bg-slate-800/60 border-slate-700 hover:bg-slate-800"
                    : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {document.filename}
                    </p>

                    <p
                      className={`text-xs mt-1 ${
                        darkMode
                          ? "text-slate-400"
                          : "text-slate-500"
                      }`}
                    >
                      {document.chunks} chunks
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      handleDeleteDocument(document.file_id)
                    }
                    className={`shrink-0 text-xs px-2 py-1 rounded ${
                      darkMode
                        ? "text-red-400 hover:bg-red-950"
                        : "text-red-500 hover:bg-red-50"
                    }`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sidebar Footer */}

        <div
          className={`p-4 border-t ${
            darkMode
              ? "border-slate-800"
              : "border-slate-200"
          }`}
        >
          <div
            className={`text-xs leading-5 ${
              darkMode
                ? "text-slate-500"
                : "text-slate-400"
            }`}
          >
            FileMind AI
            <br />
            RAG-powered document assistant
          </div>
        </div>
      </aside>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="flex-1 flex flex-col min-w-0 w-full">
        {/* ================= HEADER ================= */}

        <header
          className={`h-16 shrink-0 border-b flex items-center justify-between px-3 sm:px-6 ${
            darkMode
              ? "border-slate-800 bg-slate-950"
              : "border-slate-200 bg-white"
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile menu */}

            <button
              onClick={() => setMobileSidebarOpen(true)}
              className={`md:hidden w-9 h-9 shrink-0 rounded-lg flex items-center justify-center ${
                darkMode
                  ? "hover:bg-slate-800 text-slate-300"
                  : "hover:bg-slate-100 text-slate-600"
              }`}
              title="Open menu"
            >
              ☰
            </button>

            <div className="min-w-0">
              <h2 className="font-semibold truncate">
                Document Assistant
              </h2>

              <p
                className={`hidden sm:block text-xs truncate ${
                  darkMode
                    ? "text-slate-500"
                    : "text-slate-400"
                }`}
              >
                Ask questions about your uploaded files
              </p>
            </div>
          </div>

          {/* Theme Button */}

          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`w-10 h-10 shrink-0 rounded-xl border flex items-center justify-center transition ${
              darkMode
                ? "border-slate-700 hover:bg-slate-800"
                : "border-slate-200 hover:bg-slate-100"
            }`}
            title="Toggle theme"
          >
            {darkMode ? "☀" : "☾"}
          </button>
        </header>

        {/* ================= CHAT AREA ================= */}

        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="max-w-4xl mx-auto w-full px-3 sm:px-6 py-5 sm:py-8">
            {messages.length === 0 ? (
              /* =================================================
                 WELCOME SCREEN
              ================================================= */

              <div className="min-h-[calc(100dvh-190px)] flex flex-col items-center justify-center text-center">
                <div
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-bold mb-5 ${
                    darkMode
                      ? "bg-white text-slate-900"
                      : "bg-slate-900 text-white"
                  }`}
                >
                  F
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight px-2">
                  Chat with your documents
                </h1>

                <p
                  className={`mt-3 max-w-lg text-sm leading-6 px-2 ${
                    darkMode
                      ? "text-slate-400"
                      : "text-slate-500"
                  }`}
                >
                  Upload PDFs, Word files, spreadsheets,
                  text files, and source code. FileMind AI
                  retrieves relevant information and generates
                  answers using your documents.
                </p>

                {/* Suggestions */}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-7 w-full max-w-2xl">
                  {[
                    "What is this document about?",
                    "Summarize the uploaded document",
                    "What are the key points?",
                    "Explain the main concepts",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() =>
                        handleSuggestionClick(suggestion)
                      }
                      className={`text-left p-4 rounded-xl border transition ${
                        darkMode
                          ? "border-slate-800 bg-slate-900 hover:bg-slate-800"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <p className="text-sm font-medium">
                        {suggestion}
                      </p>

                      <span
                        className={`text-xs mt-1 block ${
                          darkMode
                            ? "text-slate-500"
                            : "text-slate-400"
                        }`}
                      >
                        Ask FileMind AI
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* =================================================
                 MESSAGES
              ================================================= */

              <div className="space-y-7">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex min-w-0 ${
                      message.role === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    {message.role === "user" ? (
                      /* ================= USER ================= */

                      <div
                        className={`max-w-[90%] sm:max-w-[75%] break-words px-4 py-3 rounded-2xl rounded-br-md text-sm leading-6 ${
                          darkMode
                            ? "bg-white text-slate-900"
                            : "bg-slate-900 text-white"
                        }`}
                      >
                        {message.content}
                      </div>
                    ) : (
                      /* ================= ASSISTANT ================= */

                      <div className="w-full max-w-3xl min-w-0">
                        <div className="flex items-start gap-2 sm:gap-3">
                          {/* AI Icon */}

                          <div
                            className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-xs font-bold ${
                              darkMode
                                ? "bg-white text-slate-900"
                                : "bg-slate-900 text-white"
                            }`}
                          >
                            F
                          </div>

                          <div className="flex-1 min-w-0 overflow-hidden">
                            {/* Markdown Answer */}

                            <div
                              className={`text-sm leading-7 break-words overflow-wrap-anywhere ${
                                darkMode
                                  ? "text-slate-200"
                                  : "text-slate-700"
                              }`}
                            >
                              <ReactMarkdown
                                components={{
                                  p: ({ children }) => (
                                    <p className="mb-3 last:mb-0">
                                      {children}
                                    </p>
                                  ),

                                  strong: ({ children }) => (
                                    <strong className="font-semibold">
                                      {children}
                                    </strong>
                                  ),

                                  ul: ({ children }) => (
                                    <ul className="list-disc ml-5 mb-3 space-y-1">
                                      {children}
                                    </ul>
                                  ),

                                  ol: ({ children }) => (
                                    <ol className="list-decimal ml-5 mb-3 space-y-1">
                                      {children}
                                    </ol>
                                  ),

                                  li: ({ children }) => (
                                    <li>{children}</li>
                                  ),

                                  h1: ({ children }) => (
                                    <h1 className="text-xl font-bold mb-3">
                                      {children}
                                    </h1>
                                  ),

                                  h2: ({ children }) => (
                                    <h2 className="text-lg font-bold mb-3">
                                      {children}
                                    </h2>
                                  ),

                                  h3: ({ children }) => (
                                    <h3 className="text-base font-semibold mb-2">
                                      {children}
                                    </h3>
                                  ),

                                  code: ({ children }) => (
                                    <code
                                      className={`px-1.5 py-0.5 rounded text-xs font-mono break-words ${
                                        darkMode
                                          ? "bg-slate-800"
                                          : "bg-slate-100"
                                      }`}
                                    >
                                      {children}
                                    </code>
                                  ),

                                  pre: ({ children }) => (
                                    <pre
                                      className={`overflow-x-auto max-w-full rounded-xl p-3 sm:p-4 my-3 text-xs ${
                                        darkMode
                                          ? "bg-slate-900 border border-slate-800"
                                          : "bg-slate-100 border border-slate-200"
                                      }`}
                                    >
                                      {children}
                                    </pre>
                                  ),
                                }}
                              >
                                {message.content}
                              </ReactMarkdown>
                            </div>

                            {/* =================================================
                               SOURCES
                            ================================================= */}

                            {message.sources &&
                              message.sources.length > 0 && (
                                <div className="mt-5">
                                  <p
                                    className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
                                      darkMode
                                        ? "text-slate-500"
                                        : "text-slate-400"
                                    }`}
                                  >
                                    Sources
                                  </p>

                                  <div className="space-y-2">
                                    {message.sources.map(
                                      (source, sourceIndex) => (
                                        <div
                                          key={sourceIndex}
                                          className={`rounded-xl border p-3 transition ${
                                            darkMode
                                              ? "bg-slate-900/70 border-slate-800 hover:border-slate-700"
                                              : "bg-slate-50 border-slate-200 hover:border-slate-300"
                                          }`}
                                        >
                                          {/* File Information */}

                                          <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-start gap-3 min-w-0">
                                              <div
                                                className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center ${
                                                  darkMode
                                                    ? "bg-slate-800"
                                                    : "bg-white border border-slate-200"
                                                }`}
                                              >
                                                📄
                                              </div>

                                              <div className="min-w-0">
                                                <p className="text-sm font-medium break-words">
                                                  {
                                                    source.filename
                                                  }
                                                </p>

                                                <p
                                                  className={`text-xs mt-0.5 ${
                                                    darkMode
                                                      ? "text-slate-500"
                                                      : "text-slate-400"
                                                  }`}
                                                >
                                                  Retrieved from
                                                  your document
                                                </p>
                                              </div>
                                            </div>

                                            <span
                                              className={`text-xs px-2 py-1 rounded-md shrink-0 ${
                                                darkMode
                                                  ? "bg-slate-800 text-slate-400"
                                                  : "bg-white text-slate-500 border border-slate-200"
                                              }`}
                                            >
                                              {sourceIndex + 1}
                                            </span>
                                          </div>

                                          {/* Metadata */}

                                          <div
                                            className={`flex flex-wrap items-center gap-2 mt-3 text-xs ${
                                              darkMode
                                                ? "text-slate-400"
                                                : "text-slate-500"
                                            }`}
                                          >
                                            {source.page_number !==
                                              undefined && (
                                              <span
                                                className={`px-2 py-1 rounded-md ${
                                                  darkMode
                                                    ? "bg-slate-800"
                                                    : "bg-white border border-slate-200"
                                                }`}
                                              >
                                                Page{" "}
                                                {
                                                  source.page_number
                                                }
                                              </span>
                                            )}

                                            <span
                                              className={`px-2 py-1 rounded-md ${
                                                darkMode
                                                  ? "bg-slate-800"
                                                  : "bg-white border border-slate-200"
                                              }`}
                                            >
                                              Chunk{" "}
                                              {
                                                source.chunk_index
                                              }
                                            </span>

                                            {source.distance !==
                                              undefined && (
                                              <span
                                                className={`px-2 py-1 rounded-md ${
                                                  darkMode
                                                    ? "bg-slate-800"
                                                    : "bg-white border border-slate-200"
                                                }`}
                                              >
                                                Distance{" "}
                                                {Number(
                                                  source.distance
                                                ).toFixed(3)}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* ================= LOADING ================= */}

                {loading && (
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div
                      className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-xs font-bold ${
                        darkMode
                          ? "bg-white text-slate-900"
                          : "bg-slate-900 text-white"
                      }`}
                    >
                      F
                    </div>

                    <div
                      className={`px-4 py-3 rounded-xl ${
                        darkMode
                          ? "bg-slate-900"
                          : "bg-slate-100"
                      }`}
                    >
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />

                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />

                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* =====================================================
            INPUT AREA
        ===================================================== */}

        <div
          className={`border-t px-3 sm:px-6 py-3 sm:py-4 shrink-0 ${
            darkMode
              ? "border-slate-800 bg-slate-950"
              : "border-slate-200 bg-white"
          }`}
        >
          <div className="max-w-4xl mx-auto">
            {/* Upload Message */}

            {uploadMessage && (
              <div
                className={`mb-3 text-xs px-3 py-2 rounded-lg break-words ${
                  darkMode
                    ? "bg-slate-900 text-slate-400"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {uploadMessage}
              </div>
            )}

            {/* Input Container */}

            <div
              className={`flex items-end gap-1 sm:gap-2 p-1.5 sm:p-2 rounded-2xl border ${
                darkMode
                  ? "bg-slate-900 border-slate-700"
                  : "bg-white border-slate-200 shadow-sm"
              }`}
            >
              {/* Upload Button */}

              <button
                onClick={handleUploadClick}
                disabled={uploading}
                className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition ${
                  darkMode
                    ? "hover:bg-slate-800 text-slate-300"
                    : "hover:bg-slate-100 text-slate-600"
                } ${
                  uploading
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                title="Upload document"
              >
                {uploading ? "..." : "📎"}
              </button>

              {/* Hidden File Input */}

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.docx,.txt,.md,.csv,.xlsx,.py,.js,.jsx,.ts,.tsx,.java,.c,.cpp,.h,.hpp,.html,.css,.json,.xml,.sql,.log"
              />

              {/* Question Input */}

              <textarea
                value={question}
                onChange={(event) =>
                  setQuestion(event.target.value)
                }
                onKeyDown={handleKeyDown}
                placeholder="Ask something about your documents..."
                rows={1}
                className={`flex-1 min-w-0 resize-none bg-transparent outline-none px-1 sm:px-2 py-2 text-sm ${
                  darkMode
                    ? "placeholder:text-slate-600"
                    : "placeholder:text-slate-400"
                }`}
              />

              {/* Send Button */}

              <button
                onClick={handleSendMessage}
                disabled={!question.trim() || loading}
                className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center font-medium transition ${
                  question.trim() && !loading
                    ? darkMode
                      ? "bg-white text-slate-900 hover:bg-slate-200"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                    : darkMode
                    ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
                title="Send message"
              >
                ↑
              </button>
            </div>

            {/* Footer */}

            <p
              className={`text-center text-[10px] sm:text-[11px] mt-2 px-2 ${
                darkMode
                  ? "text-slate-600"
                  : "text-slate-400"
              }`}
            >
              FileMind AI uses retrieved document context to
              answer your questions.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;