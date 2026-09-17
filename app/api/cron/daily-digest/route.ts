import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import { NextResponse } from "next/server";

type Item = { projectId: string; title: string; actor: string | null };

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const since = new Date();
  since.setHours(since.getHours() - 24);
  const sinceISO = since.toISOString();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://basecamp-nu-bice.vercel.app";

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .is("archived_at", null);

  if (!projects?.length) return NextResponse.json({ ok: true, emailsSent: 0 });

  const projectIds = projects.map((p) => p.id);

  const { data: lists } = await supabase
    .from("todo_lists")
    .select("id, project_id")
    .in("project_id", projectIds);

  const listProject = new Map((lists || []).map((l) => [l.id, l.project_id]));
  const listIds = [...listProject.keys()];

  const [newTodosRes, completedTodosRes, messagesRes, membersRes] =
    await Promise.all([
      supabase
        .from("todos")
        .select("title, todo_list_id, created_by")
        .in("todo_list_id", listIds)
        .gte("created_at", sinceISO),
      supabase
        .from("todos")
        .select("title, todo_list_id, completed_by")
        .in("todo_list_id", listIds)
        .eq("completed", true)
        .gte("completed_at", sinceISO),
      supabase
        .from("messages")
        .select("title, project_id, created_by")
        .in("project_id", projectIds)
        .gte("created_at", sinceISO),
      supabase
        .from("project_members")
        .select("project_id, user_id")
        .in("project_id", projectIds),
    ]);

  for (const res of [newTodosRes, completedTodosRes, messagesRes, membersRes]) {
    if (res.error) {
      return NextResponse.json({ error: res.error.message }, { status: 500 });
    }
  }

  const newTodos: Item[] = (newTodosRes.data || []).map((t) => ({
    projectId: listProject.get(t.todo_list_id)!,
    title: t.title,
    actor: t.created_by,
  }));
  const completedTodos: Item[] = (completedTodosRes.data || []).map((t) => ({
    projectId: listProject.get(t.todo_list_id)!,
    title: t.title,
    actor: t.completed_by,
  }));
  const newMessages: Item[] = (messagesRes.data || []).map((m) => ({
    projectId: m.project_id,
    title: m.title,
    actor: m.created_by,
  }));

  if (!newTodos.length && !completedTodos.length && !newMessages.length) {
    return NextResponse.json({ ok: true, emailsSent: 0 });
  }

  const members = membersRes.data || [];
  const userIds = [...new Set(members.map((m) => m.user_id))];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .in("id", userIds);

  const profileById = new Map((profiles || []).map((p) => [p.id, p]));

  function actorName(id: string | null) {
    const p = id ? profileById.get(id) : undefined;
    if (!p) return null;
    return p.full_name?.split(" ")[0] || p.email.split("@")[0];
  }

  function renderSection(heading: string, items: Item[], style = "") {
    if (!items.length) return "";
    let html = `<h4 style="margin:12px 0 6px;">${heading} (${items.length})</h4><ul style="margin:0;">`;
    for (const item of items.slice(0, 10)) {
      const by = actorName(item.actor);
      html += `<li${style}>${escapeHtml(item.title)}${
        by ? ` <span style="color:#888;">— ${escapeHtml(by)}</span>` : ""
      }</li>`;
    }
    if (items.length > 10) html += `<li>...and ${items.length - 10} more</li>`;
    return html + `</ul>`;
  }

  let emailsSent = 0;

  for (const userId of userIds) {
    const profile = profileById.get(userId);
    if (!profile?.email) continue;

    const myProjectIds = new Set(
      members.filter((m) => m.user_id === userId).map((m) => m.project_id)
    );
    // Only activity by other people; unknown actor counts as someone else.
    const relevant = (items: Item[]) =>
      items.filter((i) => myProjectIds.has(i.projectId) && i.actor !== userId);

    const mine = {
      newTodos: relevant(newTodos),
      completedTodos: relevant(completedTodos),
      newMessages: relevant(newMessages),
    };

    let body = "";
    let total = 0;
    let projectCount = 0;
    let lastProjectName = "";

    for (const project of projects) {
      const inProject = (items: Item[]) =>
        items.filter((i) => i.projectId === project.id);
      const pNew = inProject(mine.newTodos);
      const pDone = inProject(mine.completedTodos);
      const pMsgs = inProject(mine.newMessages);
      const count = pNew.length + pDone.length + pMsgs.length;
      if (count === 0) continue;

      total += count;
      projectCount++;
      lastProjectName = project.name;
      body += `<h3 style="margin:24px 0 4px;"><a href="${appUrl}/projects/${project.id}" style="color:#111;">${escapeHtml(project.name)}</a></h3>`;
      body += renderSection("New to-dos", pNew);
      body += renderSection(
        "Completed",
        pDone,
        ' style="text-decoration:line-through;color:#888;"'
      );
      body += renderSection("New messages", pMsgs);
    }

    if (total === 0) continue;

    const subject =
      projectCount === 1
        ? `[${lastProjectName}] Daily digest — ${total} update${total > 1 ? "s" : ""}`
        : `Campsite daily digest — ${total} updates across ${projectCount} projects`;

    await sendEmail({
      to: profile.email,
      subject,
      html: `<p>Hi ${escapeHtml(profile.full_name || "there")},</p>
        <p>Here's what your teammates did in the last 24 hours.</p>
        ${body}
        <p style="margin-top:24px;"><a href="${appUrl}/dashboard">Open Campsite</a></p>`,
    });
    emailsSent++;
  }

  return NextResponse.json({ ok: true, emailsSent });
}
