export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string;
  created_at: string;
  updated_at: string;
};

export type Project = {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

export type ProjectMember = {
  id: string;
  project_id: string;
  user_id: string;
  role: "owner" | "member";
  joined_at: string;
};

export type TodoList = {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  position: number;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type Todo = {
  id: string;
  todo_list_id: string;
  title: string;
  description: string | null;
  completed: boolean;
  completed_at: string | null;
  assigned_to: string | null;
  due_date: string | null;
  position: number;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  project_id: string;
  title: string;
  content: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type Comment = {
  id: string;
  message_id: string;
  content: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type Invitation = {
  id: string;
  project_id: string;
  email: string;
  invited_by: string;
  status: "pending" | "accepted" | "declined";
  token: string;
  created_at: string;
  expires_at: string;
};

export type ProjectWithMemberCount = Project & {
  member_count: number;
};

export type TodoWithAssignee = Todo & {
  assignee?: Profile | null;
};

export type MessageWithAuthor = Message & {
  author: Profile;
  comment_count?: number;
};

export type CommentWithAuthor = Comment & {
  author: Profile;
};

export type ProjectMemberWithProfile = ProjectMember & {
  profile: Profile;
};
