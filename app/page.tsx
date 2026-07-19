"use client";

import AuthGate from "@/components/AuthGate";
import NotesApp from "@/components/NotesApp";

export default function Home() {
  return <AuthGate>{(session) => <NotesApp session={session} />}</AuthGate>;
}
