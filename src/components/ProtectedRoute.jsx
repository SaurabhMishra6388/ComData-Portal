import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();

  // Wait until context is initialized
  if (isAuthenticated === null) return null;

  return isAuthenticated ? children : <Navigate to="/auth" replace />;
};
