import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";   // ✅ dùng BrowserRouter
import { Toaster } from "react-hot-toast";

import App from "@/App";
import  AuthProvider  from "@/context/AuthContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <BrowserRouter>
      <App />
      <Toaster position="top-right" />
    </BrowserRouter>
  </AuthProvider>
);