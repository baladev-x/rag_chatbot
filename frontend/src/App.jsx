import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

import {
  uploadDocument,
  sendMessage,
} from "./services/api";

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("filemind_dark_mode") === "true";
  });

  // ================= CHAT STATE =================
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(() => {
    return localStorage.getItem("filemind_current_chat");
  });
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");

  // ================= DOCUMENT / UPLOAD =================
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  // ================= CHAT LOADING =================
  const [loading, setLoading] = useState(false);

  // ================= MOBILE =================
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // ================= REFS =================
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // =====================================================
  // LOAD CHAT HISTORY
  // =====================================================
  useEffect(() => {
    const savedChats = localStorage.getItem("filemind_chats");

    if (savedChats) {
      try {
        const parsedChats = JSON.parse(savedChats);

        if (Array.isArray(parsedChats)) {
          setChats(parsedChats);

          // ---------------------------------------------
          // RESTORE LAST OPENED CHAT
          // ---------------------------------------------
          const savedCurrentChatId = localStorage.getItem(
            "filemind_current_chat"
          );

          if (savedCurrentChatId) {
            const savedChat = parsedChats.find(
              (chat) => chat.id === savedCurrentChatId
            );

            if (savedChat) {
              setCurrentChatId(savedCurrentChatId);
              setMessages(savedChat.messages || []);
            } else if (parsedChats.length > 0) {
              // If saved chat no longer exists,
              // open the most recently updated chat.
              const latestChat = [...parsedChats].sort(
                (a, b) =>
                  new Date(b.updatedAt) -
                  new Date(a.updatedAt)
              )[0];

              setCurrentChatId(latestChat.id);
              setMessages(latestChat.messages || []);

              localStorage.setItem(
                "filemind_current_chat",
                latestChat.id
              );
            }
          } else if (parsedChats.length > 0) {
            // ---------------------------------------------
            // IF NO CURRENT CHAT EXISTS
            // OPEN MOST RECENT CHAT
            // ---------------------------------------------
            const latestChat = [...parsedChats].sort(
              (a, b) =>
                new Date(b.updatedAt) -
                new Date(a.updatedAt)
            )[0];

            setCurrentChatId(latestChat.id);
            setMessages(latestChat.messages || []);

            localStorage.setItem(
              "filemind_current_chat",
              latestChat.id
            );
          }
        }
      } catch (error) {
        console.error(
          "Failed to load chats:",
          error
        );
      }
    }
  }, []);

  // =====================================================
  // SAVE CHAT HISTORY
  // =====================================================
  useEffect(() => {
    localStorage.setItem(
      "filemind_chats",
      JSON.stringify(chats)
    );
  }, [chats]);

  // =====================================================
  // SAVE CURRENT CHAT ID
  // =====================================================
  useEffect(() => {
    if (currentChatId) {
      localStorage.setItem(
        "filemind_current_chat",
        currentChatId
      );
    } else {
      localStorage.removeItem(
        "filemind_current_chat"
      );
    }
  }, [currentChatId]);

  // =====================================================
  // SAVE DARK MODE
  // =====================================================
  useEffect(() => {
    localStorage.setItem(
      "filemind_dark_mode",
      darkMode.toString()
    );
  }, [darkMode]);

  // =====================================================
  // AUTO SCROLL
  // =====================================================
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  // =====================================================
  // CREATE CHAT
  // =====================================================
  const createNewChat = (title = "New Chat") => {
    const newChat = {
      id: Date.now().toString(),
      title,
      messages: [],
      documents: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setChats((previousChats) => [
      newChat,
      ...previousChats,
    ]);

    setCurrentChatId(newChat.id);
    setMessages([]);
    setQuestion("");
    setUploadMessage("");
    setMobileSidebarOpen(false);

    return newChat.id;
  };

  // =====================================================
  // NEW CHAT
  // =====================================================
  const handleNewChat = () => {
    createNewChat();
  };

  // =====================================================
  // SELECT CHAT
  // =====================================================
  const handleSelectChat = (chatId) => {
    const selectedChat = chats.find(
      (chat) => chat.id === chatId
    );

    if (!selectedChat) {
      return;
    }

    setCurrentChatId(chatId);
    setMessages(selectedChat.messages || []);
    setQuestion("");
    setUploadMessage("");
    setMobileSidebarOpen(false);

    localStorage.setItem(
      "filemind_current_chat",
      chatId
    );
  };

  // =====================================================
  // DELETE CHAT
  // =====================================================
  const handleDeleteChat = (chatId, event) => {
    event.stopPropagation();

    const updatedChats = chats.filter(
      (chat) => chat.id !== chatId
    );

    setChats(updatedChats);

    if (currentChatId === chatId) {
      if (updatedChats.length > 0) {
        const nextChat = updatedChats[0];

        setCurrentChatId(nextChat.id);
        setMessages(nextChat.messages || []);

        localStorage.setItem(
          "filemind_current_chat",
          nextChat.id
        );
      } else {
        setCurrentChatId(null);
        setMessages([]);

        localStorage.removeItem(
          "filemind_current_chat"
        );
      }

      setQuestion("");
      setUploadMessage("");
    }
  };

  // =====================================================
  // UPDATE CURRENT CHAT
  // =====================================================
  const updateCurrentChat = (updatedMessages) => {
    if (!currentChatId) {
      return;
    }

    setChats((previousChats) =>
      previousChats.map((chat) =>
        chat.id === currentChatId
          ? {
              ...chat,
              messages: updatedMessages,
              updatedAt: new Date().toISOString(),
            }
          : chat
      )
    );
  };

  // =====================================================
  // UPDATE CHAT TITLE
  // =====================================================
  const updateChatTitle = (chatId, title) => {
    setChats((previousChats) =>
      previousChats.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              title,
              updatedAt: new Date().toISOString(),
            }
          : chat
      )
    );
  };

  // =====================================================
  // UPLOAD CLICK
  // =====================================================
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // =====================================================
  // FILE CHANGE
  // =====================================================
  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploading(true);
    setUploadMessage("");

    try {
      // ================================================
      // CREATE CHAT IF NO CHAT EXISTS
      // ================================================
      let activeChatId = currentChatId;

      const filenameWithoutExtension = file.name.replace(
        /\.[^/.]+$/,
        ""
      );

      if (!activeChatId) {
        activeChatId = createNewChat(
          filenameWithoutExtension || "New Chat"
        );
      }

      // ================================================
      // UPLOAD TO BACKEND
      // ================================================
      const data = await uploadDocument(file);

      if (data.success) {
        // ==============================================
        // UPDATE CHAT TITLE
        // ==============================================
        setChats((previousChats) =>
          previousChats.map((chat) =>
            chat.id === activeChatId &&
            chat.title === "New Chat"
              ? {
                  ...chat,
                  title:
                    filenameWithoutExtension ||
                    "New Chat",
                  updatedAt:
                    new Date().toISOString(),
                }
              : chat
          )
        );

        // ==============================================
        // STORE DOCUMENT INFO
        // ==============================================
        setChats((previousChats) =>
          previousChats.map((chat) =>
            chat.id === activeChatId
              ? {
                  ...chat,
                  documents: [
                    ...(chat.documents || []),
                    {
                      file_id:
                        data.file_id ||
                        Date.now(),
                      filename: data.filename,
                      chunks:
                        data.chunks_created,
                    },
                  ],
                  updatedAt:
                    new Date().toISOString(),
                }
              : chat
          )
        );

        setUploadMessage(
          `"${data.filename}" uploaded successfully. ${data.chunks_created} chunks created.`
        );
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

  // =====================================================
  // SEND MESSAGE
  // =====================================================
  const handleSendMessage = async () => {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || loading) {
      return;
    }

    // ================================================
    // CREATE CHAT IF NEEDED
    // ================================================
    let activeChatId = currentChatId;

    if (!activeChatId) {
      activeChatId = createNewChat(
        trimmedQuestion.length > 35
          ? `${trimmedQuestion.substring(0, 35)}...`
          : trimmedQuestion
      );
    }

    // ================================================
    // USER MESSAGE
    // ================================================
    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: trimmedQuestion,
      createdAt: new Date().toISOString(),
    };

    const updatedMessages = [
      ...messages,
      userMessage,
    ];

    setMessages(updatedMessages);

    // ================================================
    // SAVE USER MESSAGE
    // ================================================
    setChats((previousChats) =>
      previousChats.map((chat) =>
        chat.id === activeChatId
          ? {
              ...chat,
              messages: updatedMessages,
              updatedAt:
                new Date().toISOString(),
            }
          : chat
      )
    );

    // ================================================
    // CHAT TITLE
    // ================================================
    const activeChat = chats.find(
      (chat) => chat.id === activeChatId
    );

    if (
      activeChat &&
      (activeChat.title === "New Chat" ||
        activeChat.messages.length === 0)
    ) {
      const generatedTitle =
        trimmedQuestion.length > 35
          ? `${trimmedQuestion.substring(0, 35)}...`
          : trimmedQuestion;

      updateChatTitle(
        activeChatId,
        generatedTitle
      );
    }

    setQuestion("");
    setLoading(true);

    try {
      // ================================================
      // RAG API
      // ================================================
      const data = await sendMessage(
        trimmedQuestion
      );

      // ================================================
      // ASSISTANT MESSAGE
      // ================================================
      const assistantMessage = {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        content: data.success
          ? data.answer
          : data.message ||
            "I couldn't find relevant information in the uploaded documents.",
        sources: data.sources || [],
        createdAt: new Date().toISOString(),
      };

      const finalMessages = [
        ...updatedMessages,
        assistantMessage,
      ];

      setMessages(finalMessages);

      // ================================================
      // SAVE AI MESSAGE
      // ================================================
      setChats((previousChats) =>
        previousChats.map((chat) =>
          chat.id === activeChatId
            ? {
                ...chat,
                messages: finalMessages,
                updatedAt:
                  new Date().toISOString(),
              }
            : chat
        )
      );
    } catch (error) {
      console.error("Chat error:", error);

      const errorMessage =
        error.response?.data?.detail ||
        "Something went wrong while processing your question.";

      const assistantMessage = {
        id: `${Date.now()}-error`,
        role: "assistant",
        content:
          typeof errorMessage === "string"
            ? errorMessage
            : "Something went wrong while processing your question.",
        sources: [],
        createdAt: new Date().toISOString(),
      };

      const finalMessages = [
        ...updatedMessages,
        assistantMessage,
      ];

      setMessages(finalMessages);

      setChats((previousChats) =>
        previousChats.map((chat) =>
          chat.id === activeChatId
            ? {
                ...chat,
                messages: finalMessages,
                updatedAt:
                  new Date().toISOString(),
              }
            : chat
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // ENTER KEY
  // =====================================================
  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  // =====================================================
  // SUGGESTION
  // =====================================================
  const handleSuggestionClick = (text) => {
    setQuestion(text);
  };

  // =====================================================
  // FORMAT CHAT DATE
  // =====================================================
  const getChatGroup = (chat) => {
    const chatDate = new Date(chat.updatedAt);
    const today = new Date();

    const isToday =
      chatDate.toDateString() ===
      today.toDateString();

    if (isToday) {
      return "Today";
    }

    const yesterday = new Date();

    yesterday.setDate(
      yesterday.getDate() - 1
    );

    if (
      chatDate.toDateString() ===
      yesterday.toDateString()
    ) {
      return "Yesterday";
    }

    return "Previous";
  };

  // =====================================================
  // GROUP CHATS
  // =====================================================
  const groupedChats = {
    Today: [],
    Yesterday: [],
    Previous: [],
  };

  chats.forEach((chat) => {
    const group = getChatGroup(chat);

    if (!groupedChats[group]) {
      groupedChats[group] = [];
    }

    groupedChats[group].push(chat);
  });

  // =====================================================
  // RENDER
  // =====================================================
  return (
    <div
      className={`h-[100dvh] w-full flex overflow-hidden transition-colors duration-300 ${
        darkMode
          ? "bg-slate-950 text-white"
          : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* MOBILE OVERLAY */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() =>
            setMobileSidebarOpen(false)
          }
        />
      )}

      {/* SIDEBAR */}
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
        {/* LOGO */}
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

            {/* MOBILE CLOSE */}
            <button
              onClick={() =>
                setMobileSidebarOpen(false)
              }
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

        {/* NEW CHAT */}
        <div className="px-4">
          <button
            onClick={handleNewChat}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition ${
              darkMode
                ? "bg-white text-slate-900 hover:bg-slate-200"
                : "bg-slate-900 text-white hover:bg-slate-800"
            }`}
          >
            <span className="text-lg">
              +
            </span>
            New Chat
          </button>
        </div>

        {/* CHAT HISTORY HEADER */}
        <div className="px-5 pt-7 pb-3">
          <div className="flex items-center justify-between">
            <h2
              className={`text-xs font-semibold uppercase tracking-wider ${
                darkMode
                  ? "text-slate-400"
                  : "text-slate-500"
              }`}
            >
              Chats
            </h2>

            <span
              className={`text-xs px-2 py-1 rounded-full ${
                darkMode
                  ? "bg-slate-800 text-slate-300"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {chats.length}
            </span>
          </div>
        </div>

        {/* CHAT LIST */}
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          {chats.length === 0 ? (
            <div
              className={`text-center py-8 text-sm px-3 ${
                darkMode
                  ? "text-slate-500"
                  : "text-slate-400"
              }`}
            >
              No previous chats.
              <br />
              Start a new chat.
            </div>
          ) : (
            <>
              {/* TODAY */}
              {groupedChats.Today.length > 0 && (
                <div className="mb-5">
                  <p
                    className={`px-2 mb-2 text-[11px] font-semibold uppercase tracking-wider ${
                      darkMode
                        ? "text-slate-500"
                        : "text-slate-400"
                    }`}
                  >
                    Today
                  </p>

                  <div className="space-y-1">
                    {groupedChats.Today.map(
                      (chat) => (
                        <ChatItem
                          key={chat.id}
                          chat={chat}
                          currentChatId={
                            currentChatId
                          }
                          darkMode={darkMode}
                          onSelect={
                            handleSelectChat
                          }
                          onDelete={
                            handleDeleteChat
                          }
                        />
                      )
                    )}
                  </div>
                </div>
              )}

              {/* YESTERDAY */}
              {groupedChats.Yesterday.length >
                0 && (
                <div className="mb-5">
                  <p
                    className={`px-2 mb-2 text-[11px] font-semibold uppercase tracking-wider ${
                      darkMode
                        ? "text-slate-500"
                        : "text-slate-400"
                    }`}
                  >
                    Yesterday
                  </p>

                  <div className="space-y-1">
                    {groupedChats.Yesterday.map(
                      (chat) => (
                        <ChatItem
                          key={chat.id}
                          chat={chat}
                          currentChatId={
                            currentChatId
                          }
                          darkMode={darkMode}
                          onSelect={
                            handleSelectChat
                          }
                          onDelete={
                            handleDeleteChat
                          }
                        />
                      )
                    )}
                  </div>
                </div>
              )}

              {/* PREVIOUS */}
              {groupedChats.Previous.length >
                0 && (
                <div>
                  <p
                    className={`px-2 mb-2 text-[11px] font-semibold uppercase tracking-wider ${
                      darkMode
                        ? "text-slate-500"
                        : "text-slate-400"
                    }`}
                  >
                    Previous
                  </p>

                  <div className="space-y-1">
                    {groupedChats.Previous.map(
                      (chat) => (
                        <ChatItem
                          key={chat.id}
                          chat={chat}
                          currentChatId={
                            currentChatId
                          }
                          darkMode={darkMode}
                          onSelect={
                            handleSelectChat
                          }
                          onDelete={
                            handleDeleteChat
                          }
                        />
                      )
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* SIDEBAR FOOTER */}
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

      {/* MAIN */}
      <main className="flex-1 flex flex-col min-w-0 w-full">
        {/* HEADER */}
        <header
          className={`h-16 shrink-0 border-b flex items-center justify-between px-3 sm:px-6 ${
            darkMode
              ? "border-slate-800 bg-slate-950"
              : "border-slate-200 bg-white"
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            {/* MOBILE MENU */}
            <button
              onClick={() =>
                setMobileSidebarOpen(true)
              }
              className={`md:hidden w-9 h-9 shrink-0 rounded-lg flex items-center justify-center ${
                darkMode
                  ? "hover:bg-slate-800 text-slate-300"
                  : "hover:bg-slate-100 text-slate-600"
              }`}
            >
              ☰
            </button>

            <div className="min-w-0">
              <h2 className="font-semibold truncate">
                {currentChatId
                  ? chats.find(
                      (chat) =>
                        chat.id ===
                        currentChatId
                    )?.title ||
                    "Document Assistant"
                  : "Document Assistant"}
              </h2>

              <p
                className={`hidden sm:block text-xs truncate ${
                  darkMode
                    ? "text-slate-500"
                    : "text-slate-400"
                }`}
              >
                Ask questions about your uploaded
                files
              </p>
            </div>
          </div>

          {/* THEME */}
          <button
            onClick={() =>
              setDarkMode(!darkMode)
            }
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

        {/* CHAT AREA */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="max-w-4xl mx-auto w-full px-3 sm:px-6 py-5 sm:py-8">
            {messages.length === 0 ? (
              /* WELCOME */
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
                  Upload PDFs, Word files,
                  spreadsheets, text files, and
                  source code. FileMind AI
                  retrieves relevant information
                  and generates answers using your
                  documents.
                </p>

                {/* SUGGESTIONS */}
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
                        handleSuggestionClick(
                          suggestion
                        )
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
              /* MESSAGES */
              <div className="space-y-7">
                {messages.map(
                  (message, index) => (
                    <div
                      key={
                        message.id || index
                      }
                      className={`flex min-w-0 ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      {message.role ===
                      "user" ? (
                        /* USER */
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
                        /* ASSISTANT */
                        <div className="w-full max-w-3xl min-w-0">
                          <div className="flex items-start gap-2 sm:gap-3">
                            {/* AI ICON */}
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
                              {/* MARKDOWN */}
                              <div
                                className={`text-sm leading-7 break-words overflow-wrap-anywhere ${
                                  darkMode
                                    ? "text-slate-200"
                                    : "text-slate-700"
                                }`}
                              >
                                <ReactMarkdown
                                  components={{
                                    p: ({
                                      children,
                                    }) => (
                                      <p className="mb-3 last:mb-0">
                                        {children}
                                      </p>
                                    ),

                                    strong: ({
                                      children,
                                    }) => (
                                      <strong className="font-semibold">
                                        {children}
                                      </strong>
                                    ),

                                    ul: ({
                                      children,
                                    }) => (
                                      <ul className="list-disc ml-5 mb-3 space-y-1">
                                        {children}
                                      </ul>
                                    ),

                                    ol: ({
                                      children,
                                    }) => (
                                      <ol className="list-decimal ml-5 mb-3 space-y-1">
                                        {children}
                                      </ol>
                                    ),

                                    li: ({
                                      children,
                                    }) => (
                                      <li>
                                        {children}
                                      </li>
                                    ),

                                    h1: ({
                                      children,
                                    }) => (
                                      <h1 className="text-xl font-bold mb-3">
                                        {children}
                                      </h1>
                                    ),

                                    h2: ({
                                      children,
                                    }) => (
                                      <h2 className="text-lg font-bold mb-3">
                                        {children}
                                      </h2>
                                    ),

                                    h3: ({
                                      children,
                                    }) => (
                                      <h3 className="text-base font-semibold mb-2">
                                        {children}
                                      </h3>
                                    ),

                                    code: ({
                                      children,
                                    }) => (
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

                                    pre: ({
                                      children,
                                    }) => (
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

                              {/* SOURCES */}
                              {message.sources &&
                                message.sources
                                  .length >
                                  0 && (
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
                                        (
                                          source,
                                          sourceIndex
                                        ) => (
                                          <div
                                            key={
                                              sourceIndex
                                            }
                                            className={`rounded-xl border p-3 transition ${
                                              darkMode
                                                ? "bg-slate-900/70 border-slate-800 hover:border-slate-700"
                                                : "bg-slate-50 border-slate-200 hover:border-slate-300"
                                            }`}
                                          >
                                            {/* FILE */}
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
                                                    Retrieved
                                                    from
                                                    your
                                                    document
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
                                                {sourceIndex +
                                                  1}
                                              </span>
                                            </div>

                                            {/* METADATA */}
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
                                                  ).toFixed(
                                                    3
                                                  )}
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
                  )
                )}

                {/* LOADING */}
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

        {/* INPUT AREA */}
        <div
          className={`border-t px-3 sm:px-6 py-3 sm:py-4 shrink-0 ${
            darkMode
              ? "border-slate-800 bg-slate-950"
              : "border-slate-200 bg-white"
          }`}
        >
          <div className="max-w-4xl mx-auto">
            {/* UPLOAD MESSAGE */}
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

            {/* INPUT */}
            <div
              className={`flex items-end gap-1 sm:gap-2 p-1.5 sm:p-2 rounded-2xl border ${
                darkMode
                  ? "bg-slate-900 border-slate-700"
                  : "bg-white border-slate-200 shadow-sm"
              }`}
            >
              {/* UPLOAD */}
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

              {/* FILE INPUT */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.docx,.txt,.md,.csv,.xlsx,.py,.js,.jsx,.ts,.tsx,.java,.c,.cpp,.h,.hpp,.html,.css,.json,.xml,.sql,.log"
              />

              {/* QUESTION */}
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

              {/* SEND */}
              <button
                onClick={handleSendMessage}
                disabled={
                  !question.trim() || loading
                }
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

            {/* FOOTER */}
            <p
              className={`text-center text-[10px] sm:text-[11px] mt-2 px-2 ${
                darkMode
                  ? "text-slate-600"
                  : "text-slate-400"
              }`}
            >
              FileMind AI uses retrieved document
              context to answer your questions.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

/* =========================================================
   CHAT ITEM COMPONENT
========================================================= */

function ChatItem({
  chat,
  currentChatId,
  darkMode,
  onSelect,
  onDelete,
}) {
  return (
    <div
      className={`group flex items-center gap-1 rounded-xl transition ${
        currentChatId === chat.id
          ? darkMode
            ? "bg-slate-800"
            : "bg-slate-100"
          : darkMode
          ? "hover:bg-slate-800/70"
          : "hover:bg-slate-100"
      }`}
    >
      <button
        onClick={() => onSelect(chat.id)}
        className="flex-1 min-w-0 text-left px-3 py-3"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm shrink-0">
            💬
          </span>

          <span
            className={`text-sm truncate ${
              currentChatId === chat.id
                ? darkMode
                  ? "text-white font-medium"
                  : "text-slate-900 font-medium"
                : darkMode
                ? "text-slate-300"
                : "text-slate-700"
            }`}
          >
            {chat.title}
          </span>
        </div>
      </button>

      {/* DELETE */}
      <button
        onClick={(event) =>
          onDelete(chat.id, event)
        }
        className={`opacity-0 group-hover:opacity-100 mr-2 w-7 h-7 rounded-lg flex items-center justify-center text-xs transition ${
          darkMode
            ? "text-slate-500 hover:text-red-400 hover:bg-slate-700"
            : "text-slate-400 hover:text-red-500 hover:bg-slate-200"
        }`}
        title="Delete chat"
      >
        🗑
      </button>
    </div>
  );
}

export default App;