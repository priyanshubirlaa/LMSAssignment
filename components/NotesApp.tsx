"use client";

import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Note } from "@/lib/types";

type AiResult<T> = { data?: T; error?: string; retryAfterSeconds?: number };

async function callAi<T>(endpoint: string, content: string): Promise<AiResult<T>> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  const data = await res.json();
  if (!res.ok) {
    return { error: data.error || "Request failed", retryAfterSeconds: data.retryAfterSeconds };
  }
  return { data };
}

export default function NotesApp({ session }: { session: Session }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [summarizingId, setSummarizingId] = useState<string | null>(null);
  const [taggingId, setTaggingId] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const [aiCooldownUntil, setAiCooldownUntil] = useState<number | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  useEffect(() => {
    loadNotes();
  }, []);

  useEffect(() => {
    if (!aiCooldownUntil) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((aiCooldownUntil - Date.now()) / 1000));
      setCooldownRemaining(remaining);
      if (remaining <= 0) setAiCooldownUntil(null);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [aiCooldownUntil]);

  const aiDisabled = aiCooldownUntil !== null;

  async function loadNotes() {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setNotes(data as Note[]);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    setError(null);
    const { error } = await supabase
      .from("notes")
      .insert({ title, content, user_id: session.user.id });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setTitle("");
    setContent("");
    loadNotes();
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error) setError(error.message);
    else setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  function startEdit(note: Note) {
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle("");
    setEditContent("");
  }

  async function saveEdit(id: string) {
    if (!editTitle.trim() || !editContent.trim()) return;
    const { error } = await supabase
      .from("notes")
      .update({ title: editTitle, content: editContent })
      .eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, title: editTitle, content: editContent } : n))
    );
    cancelEdit();
  }

  function handleAiError(err: string, retryAfterSeconds?: number) {
    setError(err);
    if (retryAfterSeconds) {
      setAiCooldownUntil(Date.now() + retryAfterSeconds * 1000);
    }
  }

  async function handleSummarize(note: Note) {
    setSummarizingId(note.id);
    setError(null);
    const result = await callAi<{ summary: string }>("/api/summarize", note.content);
    setSummarizingId(null);

    if (result.error || !result.data) {
      handleAiError(result.error || "Failed to summarize", result.retryAfterSeconds);
      return;
    }

    const { error } = await supabase
      .from("notes")
      .update({ summary: result.data.summary })
      .eq("id", note.id);
    if (error) {
      setError(error.message);
      return;
    }
    setNotes((prev) =>
      prev.map((n) => (n.id === note.id ? { ...n, summary: result.data!.summary } : n))
    );
  }

  async function handleGenerateTags(note: Note) {
    setTaggingId(note.id);
    setError(null);
    const result = await callAi<{ tags: string[] }>("/api/tags", note.content);
    setTaggingId(null);

    if (result.error || !result.data) {
      handleAiError(result.error || "Failed to generate tags", result.retryAfterSeconds);
      return;
    }

    const { error } = await supabase
      .from("notes")
      .update({ tags: result.data.tags })
      .eq("id", note.id);
    if (error) {
      setError(error.message);
      return;
    }
    setNotes((prev) =>
      prev.map((n) => (n.id === note.id ? { ...n, tags: result.data!.tags } : n))
    );
  }

  const allTags = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => n.tags?.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [notes]);

  const visibleNotes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return notes.filter((n) => {
      const matchesSearch =
        !q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
      const matchesTag = !tagFilter || n.tags?.includes(tagFilter);
      return matchesSearch && matchesTag;
    });
  }, [notes, search, tagFilter]);

  return (
    <div className="container">
      <div className="top-bar">
        <div>
          <h1>AI Notes</h1>
          <p className="subtitle" style={{ marginBottom: 0 }}>
            Signed in as {session.user.email}
          </p>
        </div>
        <button className="secondary" onClick={() => supabase.auth.signOut()}>
          Sign out
        </button>
      </div>

      {error && (
        <p className="error">
          {error}
          {aiCooldownUntil && ` Try again in ${cooldownRemaining}s.`}
        </p>
      )}

      <form className="card" onSubmit={handleCreate}>
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="Write your note..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Add note"}
        </button>
      </form>

      <div className="card">
        <input
          placeholder="Search notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginBottom: allTags.length ? "0.75rem" : 0 }}
        />
        {allTags.length > 0 && (
          <div className="row" style={{ flexWrap: "wrap", gap: "0.4rem" }}>
            {allTags.map((t) => (
              <button
                key={t}
                className="secondary"
                style={
                  tagFilter === t
                    ? { background: "#4f7cff", borderColor: "#4f7cff", color: "white" }
                    : undefined
                }
                onClick={() => setTagFilter(tagFilter === t ? null : t)}
              >
                #{t}
              </button>
            ))}
          </div>
        )}
      </div>

      {visibleNotes.map((note) => (
        <div className="card" key={note.id}>
          {editingId === note.id ? (
            <>
              <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
              <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} />
              <div className="row">
                <button onClick={() => saveEdit(note.id)}>Save</button>
                <button className="secondary" onClick={cancelEdit}>
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="note-title">{note.title}</div>
              <div className="note-content">{note.content}</div>
              {note.summary && <div className="summary">✦ {note.summary}</div>}
              {note.tags && note.tags.length > 0 && (
                <div className="row" style={{ flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.5rem" }}>
                  {note.tags.map((t) => (
                    <span key={t} className="muted">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
              <div className="row" style={{ flexWrap: "wrap" }}>
                <button
                  className="secondary"
                  disabled={summarizingId === note.id || aiDisabled}
                  onClick={() => handleSummarize(note)}
                >
                  {summarizingId === note.id ? "Summarizing..." : "Summarize with AI"}
                </button>
                <button
                  className="secondary"
                  disabled={taggingId === note.id || aiDisabled}
                  onClick={() => handleGenerateTags(note)}
                >
                  {taggingId === note.id ? "Tagging..." : "Generate tags"}
                </button>
                <button className="secondary" onClick={() => startEdit(note)}>
                  Edit
                </button>
                <button className="secondary" onClick={() => handleDelete(note.id)}>
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      ))}

      {visibleNotes.length === 0 && notes.length > 0 && (
        <p className="muted">No notes match your search/filter.</p>
      )}
      {notes.length === 0 && <p className="muted">No notes yet. Add your first one above.</p>}
    </div>
  );
}
