import React from "react";
// import { useAuth } from "@/contexts/AuthContext";
// import { Navigate } from "react-router-dom";

// ⚠️  UI TESTING MODE — auth check bypassed. Restore the lines above & remove
//     this override before deploying to production.
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // const { currentUser } = useAuth();
  // if (currentUser === null) return <Navigate to="/login" />;
  return <>{children}</>;
};

export default ProtectedRoute;
