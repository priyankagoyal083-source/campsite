import { Client } from "pg";
import { put, list, del } from "@vercel/blob";
import { NextResponse } from "next/server";

const TABLES = [
  "profiles",
  "projects",
  "project_members",
  "todo_lists",
  "todos",
  "todo_comments",
  "messages",
  "comments",
  "invitations",
  "notifications",
];

const RETENTION_DAYS = 30;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = new Client({
    connectionString: process.env.POSTGRES_URL_NON_POOLING,
  });

  await client.connect();

  try {
    const backup: Record<string, unknown[]> = {};

    for (const table of TABLES) {
      const result = await client.query(`SELECT * FROM public.${table}`);
      backup[table] = result.rows;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `backups/campsite-backup-${timestamp}.json`;

    const blob = await put(filename, JSON.stringify(backup, null, 2), {
      access: "public",
      contentType: "application/json",
    });

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);

    const { blobs } = await list({ prefix: "backups/" });
    const expired = blobs.filter((b) => new Date(b.uploadedAt) < cutoff);

    if (expired.length > 0) {
      await del(expired.map((b) => b.url));
    }

    return NextResponse.json({
      ok: true,
      url: blob.url,
      tables: TABLES,
      rowCounts: Object.fromEntries(
        TABLES.map((t) => [t, backup[t].length])
      ),
      deletedExpiredBackups: expired.length,
      retentionDays: RETENTION_DAYS,
    });
  } finally {
    await client.end();
  }
}
