import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import { NextResponse } from "next/server";

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

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .is("archived_at", null);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://basecamp-nu-bice.vercel.app";
  let emailsSent = 0;

  for (const project of projects || []) {
    const { data: newTodos } = await supabase
      .from("todos")
      .select("title, created_at, todo_list_id")
      .in(
        "todo_list_id",
        (
          await supabase
            .from("todo_lists")
            .select("id")
            .eq("project_id", project.id)
        ).data?.map((l) => l.id) || []
      )
      .gte("created_at", sinceISO);

    const { data: completedTodos } = await supabase
      .from("todos")
      .select("title, completed_at, todo_list_id")
      .in(
        "todo_list_id",
        (
          await supabase
            .from("todo_lists")
            .select("id")
            .eq("project_id", project.id)
        ).data?.map((l) => l.id) || []
      )
      .eq("completed", true)
      .gte("completed_at", sinceISO);

    const { data: newMessages } = await supabase
      .from("messages")
      .select("title, created_at")
      .eq("project_id", project.id)
      .gte("created_at", sinceISO);

    const { data: newComments } = await supabase
      .from("todo_comments")
      .select("content, created_at, todo_id")
      .in(
        "todo_id",
        (
          await supabase
            .from("todos")
            .select("id, todo_list_id")
            .in(
              "todo_list_id",
              (
                await supabase
                  .from("todo_lists")
                  .select("id")
                  .eq("project_id", project.id)
              ).data?.map((l) => l.id) || []
            )
        ).data?.map((t) => t.id) || []
      )
      .gte("created_at", sinceISO);

    const totalActivity =
      (newTodos?.length || 0) +
      (completedTodos?.length || 0) +
      (newMessages?.length || 0) +
      (newComments?.length || 0);

    if (totalActivity === 0) continue;

    const { data: members } = await supabase
      .from("project_members")
      .select("user_id")
      .eq("project_id", project.id);

    const memberIds = (members || []).map((m) => m.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("email, full_name")
      .in("id", memberIds);

    let html = `<h2 style="margin:0 0 16px;">Daily digest for ${project.name}</h2>`;

    if (newTodos && newTodos.length > 0) {
      html += `<h3 style="margin:16px 0 8px;">New to-dos (${newTodos.length})</h3><ul>`;
      for (const todo of newTodos.slice(0, 10)) {
        html += `<li>${todo.title}</li>`;
      }
      if (newTodos.length > 10) html += `<li>...and ${newTodos.length - 10} more</li>`;
      html += `</ul>`;
    }

    if (completedTodos && completedTodos.length > 0) {
      html += `<h3 style="margin:16px 0 8px;">Completed (${completedTodos.length})</h3><ul>`;
      for (const todo of completedTodos.slice(0, 10)) {
        html += `<li style="text-decoration:line-through;color:#888;">${todo.title}</li>`;
      }
      if (completedTodos.length > 10) html += `<li>...and ${completedTodos.length - 10} more</li>`;
      html += `</ul>`;
    }

    if (newMessages && newMessages.length > 0) {
      html += `<h3 style="margin:16px 0 8px;">New messages (${newMessages.length})</h3><ul>`;
      for (const msg of newMessages) {
        html += `<li>${msg.title}</li>`;
      }
      html += `</ul>`;
    }

    if (newComments && newComments.length > 0) {
      html += `<p style="color:#888;margin:16px 0 8px;">${newComments.length} new comment${newComments.length > 1 ? "s" : ""} on to-dos</p>`;
    }

    html += `<p style="margin-top:24px;"><a href="${appUrl}/projects/${project.id}">View project in Campsite</a></p>`;

    for (const profile of profiles || []) {
      await sendEmail({
        to: profile.email,
        subject: `[${project.name}] Daily digest — ${totalActivity} updates`,
        html: `<p>Hi ${profile.full_name || "there"},</p>${html}`,
      });
      emailsSent++;
    }
  }

  return NextResponse.json({ ok: true, emailsSent });
}
