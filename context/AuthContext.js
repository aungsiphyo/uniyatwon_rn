import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";

const AuthContext = createContext({
  signIn: (token, username) => {},
  signOut: () => {},
  userSession: null,
  updateSession: (newData) => {},
  isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [userSession, setUserSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStorageData = async () => {
      try {
        let userUuid, username, token, isAdmin, photo;

        if (Platform.OS === "web") {
          userUuid = localStorage.getItem("user_uuid");
          username = localStorage.getItem("Username");
          token = localStorage.getItem("token");
          isAdmin = localStorage.getItem("is_admin");
          photo = localStorage.getItem("Profile_photo");
        } else {
          userUuid = await AsyncStorage.getItem("user_uuid");
          username = await AsyncStorage.getItem("Username");
          token = await AsyncStorage.getItem("token");
          isAdmin = await AsyncStorage.getItem("is_admin");
          photo = await AsyncStorage.getItem("Profile_photo");
        }

        if (userUuid && username) {
          console.log("AuthContext: Session found", { username, isAdmin });
          setUserSession({
            user_uuid: userUuid,
            Username: username,
            token,
            is_admin: isAdmin ? parseInt(isAdmin) : 0,
            Profile_photo: photo || "default.png",
          });
        } else {
          console.log("AuthContext: No session found");
        }
      } catch (e) {
        console.error("Failed to load login state", e);
      } finally {
        setIsLoading(false);
      }
    };

    loadStorageData();
  }, []);

  const signIn = async (userUuid, username, token, isAdmin) => {
    try {
      if (Platform.OS === "web") {
        localStorage.setItem("user_uuid", userUuid);
        localStorage.setItem("Username", username);
        localStorage.setItem("token", token);
        localStorage.setItem("is_admin", isAdmin.toString());
      } else {
        await AsyncStorage.setItem("user_uuid", userUuid);
        await AsyncStorage.setItem("Username", username);
        await AsyncStorage.setItem("token", token);
        if (isAdmin !== undefined && isAdmin !== null) {
          await AsyncStorage.setItem("is_admin", isAdmin.toString());
        }
      }
      setUserSession({
        user_uuid: userUuid,
        Username: username,
        token,
        is_admin: isAdmin !== undefined ? parseInt(isAdmin) : 0,
        Profile_photo: "default.png",
      });
    } catch (e) {
      console.error("Sign in error", e);
    }
  };

  const signOut = async () => {
    try {
      if (Platform.OS === "web") {
        localStorage.removeItem("user_uuid");
        localStorage.removeItem("Username");
        localStorage.removeItem("token");
        localStorage.removeItem("is_admin");
      } else {
        await AsyncStorage.removeItem("user_uuid");
        await AsyncStorage.removeItem("Username");
        await AsyncStorage.removeItem("token");
        await AsyncStorage.removeItem("is_admin");
      }
      setUserSession(null);
    } catch (e) {
      console.error("Sign out error", e);
    }
  };

  const updateSession = async (newData) => {
    try {
      const updated = { ...userSession, ...newData };
      setUserSession(updated);

      // Persist changes
      if (newData.Username)
        await AsyncStorage.setItem("Username", newData.Username);
      if (newData.Profile_photo)
        await AsyncStorage.setItem("Profile_photo", newData.Profile_photo);
      if (newData.is_admin !== undefined)
        await AsyncStorage.setItem("is_admin", newData.is_admin.toString());
    } catch (e) {
      console.error("Update session error", e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        signIn,
        signOut,
        updateSession,
        userSession,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
