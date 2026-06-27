import { redirect } from "react-router";

// "/" simply forwards to the dashboard; the app-layout guard handles auth.
export async function clientLoader() {
  throw redirect("/dashboard");
}

export default function Home() {
  return null;
}
