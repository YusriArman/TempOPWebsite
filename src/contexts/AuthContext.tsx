import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "@/lib/firebaseConfig";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  User,
  UserCredential,
} from "firebase/auth";
import { Skeleton } from "@/components/ui/skeleton";

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw Error;
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string) =>
    await signInWithEmailAndPassword(auth, email, password);

  const logout = async () => await firebaseSignOut(auth);

  useEffect(() => {
    // Fallback: if Firebase Auth doesn't resolve in 2s (e.g. no valid credentials),
    // stop blocking the UI so we can test the interface.
    const timeout = setTimeout(() => setLoading(false), 2000);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      clearTimeout(timeout);
      setCurrentUser(user);
      setLoading(false);
    });
    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  const value = {
    currentUser,
    login,
    logout,
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center">
        <div className="flex flex-col space-y-3">
          <Skeleton className="h-[125px] w-[250px] rounded-xl">
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[250px]" />
            </div>
          </Skeleton>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
