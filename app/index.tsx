import { Redirect } from "expo-router";
import { useAuth } from "../context/AuthContext";

// The app opens at "/": go to Home if the donor is already logged in,
// otherwise to Login. (The root layout waits for the saved login first.)
export default function Index() {
  const { user } = useAuth();
  return <Redirect href={user ? "/home" : "/login"} />;
}
