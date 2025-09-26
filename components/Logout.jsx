import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAuth, signOut } from "firebase/auth";

const logout = async () => {
  const auth = getAuth();
  await signOut(auth);
  await AsyncStorage.removeItem("isUserAuthenticated");
};
export default logout