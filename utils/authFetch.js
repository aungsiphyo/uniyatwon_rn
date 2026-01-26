import AsyncStorage from "@react-native-async-storage/async-storage";

const authFetch = async (url, options = {}) => {
  const token = await AsyncStorage.getItem("token");
  if (!token) throw new Error("No token");

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};

export default authFetch;
