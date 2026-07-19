export type Note = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  summary: string | null;
  tags: string[] | null;
  created_at: string;
};
