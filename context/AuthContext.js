import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

const AuthContext = createContext({
  signIn: (token, username) => {},
  signOut: () => {},
  userSession: null,
  isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [userSession, setUserSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStorageData = async () => {
      try {
        let userUuid, username;
        
        if (Platform.OS === 'web') {
          userUuid = localStorage.getItem('user_uuid');
          username = localStorage.getItem('Username');
        } else {
          userUuid = await AsyncStorage.getItem('user_uuid');
          username = await AsyncStorage.getItem('Username');
        }

        if (userUuid && username) {
          console.log("AuthContext: Session found", { username });
          setUserSession({ user_uuid: userUuid, Username: username });
        } else {
          console.log("AuthContext: No session found");
        }
      } catch (e) {
        console.error('Failed to load login state', e);
      } finally {
        setIsLoading(false);
      }
    };

    // TEMPORARY: Clear session for testing the new auth flow
    AsyncStorage.clear(); 
    if (Platform.OS === 'web') {
      localStorage.clear();
    }

    loadStorageData();
  }, []);

  const signIn = async (userUuid, username) => {
    try {
        if (Platform.OS === 'web') {
            localStorage.setItem('user_uuid', userUuid);
            localStorage.setItem('Username', username);
        } else {
            await AsyncStorage.setItem('user_uuid', userUuid);
            await AsyncStorage.setItem('Username', username);
        }
        setUserSession({ user_uuid: userUuid, Username: username });
    } catch (e) {
        console.error("Sign in error", e);
    }
  };

  const signOut = async () => {
    try {
        if (Platform.OS === 'web') {
            localStorage.removeItem('user_uuid');
            localStorage.removeItem('Username');
        } else {
            await AsyncStorage.removeItem('user_uuid');
            await AsyncStorage.removeItem('Username');
        }
        setUserSession(null);
    } catch (e) {
        console.error("Sign out error", e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        signIn,
        signOut,
        userSession,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
