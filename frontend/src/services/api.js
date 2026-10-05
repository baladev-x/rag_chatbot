import axios from "axios";

const API = axios.create({
  baseURL: "https://rag-chatbot-backend-rohx.onrender.com",
});

export const uploadDocument = async (file) => {
  const formData = new FormData();

  formData.append("file", file);

  const response = await API.post(
    "/upload/",
    formData
  );

  return response.data;
};

export const getDocuments = async () => {
  const response = await API.get(
    "/documents/"
  );

  return response.data;
};

export const deleteDocument = async (fileId) => {
  const response = await API.delete(
    `/documents/${fileId}`
  );

  return response.data;
};

export const sendMessage = async (
  question,
  topK = 5
) => {
  const response = await API.post(
    "/chat/",
    {
      question,
      top_k: topK,
    }
  );

  return response.data;
};