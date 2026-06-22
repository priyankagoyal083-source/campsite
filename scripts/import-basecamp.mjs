#!/usr/bin/env node
// Import Basecamp 3 data into Campsite (Supabase)
// Usage: node scripts/import-basecamp.mjs

const BC_TOKEN = process.env.BC_TOKEN;
const BC_ACCOUNT = '5704007';
const BC_BASE = `https://3.basecampapi.com/${BC_ACCOUNT}`;
const UA = 'Campsite Import (campsite@rigorousthemes.com)';

const SUPA_URL = 'https://ehwxpowyppjvddchcofw.supabase.co';
const SUPA_KEY = process.env.SUPA_SERVICE_KEY;
const USER_ID = '2a0af33c-615c-4544-8fa9-657b4398410a'; // Priyanka's profile

if (!BC_TOKEN || !SUPA_KEY) {
  console.error('Set BC_TOKEN and SUPA_SERVICE_KEY env vars');
  process.exit(1);
}

// ── Basecamp API helpers ────────────────────────────────────────────────────

async function bc(path) {
  const url = path.startsWith('http') ? path : `${BC_BASE}${path}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${BC_TOKEN}`, 'User-Agent': UA },
  });
  if (!res.ok) {
    console.error(`BC API error: ${res.status} ${res.statusText} for ${url}`);
    return null;
  }
  return res.json();
}

async function bcPaginated(path) {
  let url = path.startsWith('http') ? path : `${BC_BASE}${path}`;
  const all = [];
  while (url) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${BC_TOKEN}`, 'User-Agent': UA },
    });
    if (!res.ok) break;
    const data = await res.json();
    all.push(...data);
    // Basecamp uses Link header for pagination
    const link = res.headers.get('Link');
    const next = link?.match(/<([^>]+)>;\s*rel="next"/);
    url = next ? next[1] : null;
  }
  return all;
}

// ── Supabase helpers ────────────────────────────────────────────────────────

const headers = {
  apikey: SUPA_KEY,
  Authorization: `Bearer ${SUPA_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

async function supa(table, method, body, query = '') {
  const url = `${SUPA_URL}/rest/v1/${table}${query}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) {
    const err = await res.text();
    console.error(`Supabase ${method} ${table} error:`, err);
    return null;
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function insert(table, rows) {
  if (!rows.length) return [];
  const res = await supa(table, 'POST', rows);
  return res || [];
}

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ── Main import ─────────────────────────────────────────────────────────────

async function main() {
  console.log('Fetching Basecamp projects...');
  const bcProjects = await bc('/projects.json');
  if (!bcProjects) { console.error('Failed to fetch projects'); return; }

  console.log(`Found ${bcProjects.length} projects\n`);

  let totalTodoLists = 0, totalTodos = 0, totalMessages = 0, totalComments = 0;

  for (const bp of bcProjects) {
    console.log(`\n━━━ Importing: ${bp.name} ━━━`);

    // Create project
    const [project] = await insert('projects', [{
      name: bp.name,
      description: bp.description || '',
      created_by: USER_ID,
      created_at: bp.created_at,
      updated_at: bp.updated_at,
    }]);

    if (!project) { console.error(`  Failed to create project: ${bp.name}`); continue; }
    console.log(`  ✓ Project created: ${project.id}`);

    // Add user as owner
    await insert('project_members', [{
      project_id: project.id,
      user_id: USER_ID,
      role: 'owner',
    }]);

    // ── Find todoset and message board from project docks ────────────────
    const todosetDock = bp.dock?.find(d => d.name === 'todoset');
    const mbDock = bp.dock?.find(d => d.name === 'message_board');

    // ── Import To-do Lists + Todos ──────────────────────────────────────
    if (todosetDock) {
      const todoset = await bc(todosetDock.url);
      if (todoset) {
        const bcTodoLists = await bcPaginated(todoset.todolists_url?.replace('.json', '') + '.json');
        console.log(`  📋 ${bcTodoLists.length} to-do lists`);

        for (const btl of bcTodoLists) {
          const [todoList] = await insert('todo_lists', [{
            project_id: project.id,
            name: btl.title || btl.name || 'Untitled',
            description: stripHtml(btl.description) || '',
            created_by: USER_ID,
            created_at: btl.created_at,
            updated_at: btl.updated_at,
          }]);
          if (!todoList) continue;
          totalTodoLists++;

          // Fetch todos for this list
          const bcTodos = await bcPaginated(btl.todos_url?.replace('.json', '') + '.json');
          if (bcTodos.length) {
            const todoRows = bcTodos.map(bt => ({
              todo_list_id: todoList.id,
              title: stripHtml(bt.title) || bt.content || 'Untitled',
              description: stripHtml(bt.description) || '',
              completed: bt.completed || false,
              completed_at: bt.completed_at || null,
              due_date: bt.due_on || null,
              created_by: USER_ID,
              created_at: bt.created_at,
              updated_at: bt.updated_at,
            }));
            const inserted = await insert('todos', todoRows);
            totalTodos += inserted?.length || 0;

            // Fetch comments on each todo
            for (let i = 0; i < bcTodos.length; i++) {
              const bt = bcTodos[i];
              const insertedTodo = inserted?.[i];
              if (!insertedTodo || !bt.comments_url) continue;

              const bcComments = await bcPaginated(bt.comments_url.replace('.json', '') + '.json');
              if (bcComments.length) {
                const commentRows = bcComments.map(c => ({
                  todo_id: insertedTodo.id,
                  content: stripHtml(c.content) || '(empty)',
                  created_by: USER_ID,
                  created_at: c.created_at,
                  updated_at: c.updated_at,
                }));
                const ic = await insert('todo_comments', commentRows);
                totalComments += ic?.length || 0;
              }
            }
          }
          console.log(`    ✓ ${btl.title || btl.name}: ${bcTodos.length} todos`);
        }

        // Also import completed todo lists
        if (todoset.completed_todolists_url) {
          const completedLists = await bcPaginated(todoset.completed_todolists_url.replace('.json', '') + '.json');
          console.log(`  📋 ${completedLists.length} completed to-do lists`);
          for (const btl of completedLists) {
            const [todoList] = await insert('todo_lists', [{
              project_id: project.id,
              name: `[Done] ${btl.title || btl.name || 'Untitled'}`,
              description: stripHtml(btl.description) || '',
              created_by: USER_ID,
              created_at: btl.created_at,
              updated_at: btl.updated_at,
            }]);
            if (!todoList) continue;
            totalTodoLists++;

            const bcTodos = await bcPaginated(btl.todos_url?.replace('.json', '') + '.json');
            if (bcTodos.length) {
              const todoRows = bcTodos.map(bt => ({
                todo_list_id: todoList.id,
                title: stripHtml(bt.title) || bt.content || 'Untitled',
                description: stripHtml(bt.description) || '',
                completed: true,
                completed_at: bt.completed_at || bt.updated_at,
                due_date: bt.due_on || null,
                created_by: USER_ID,
                created_at: bt.created_at,
                updated_at: bt.updated_at,
              }));
              await insert('todos', todoRows);
              totalTodos += todoRows.length;
            }
            console.log(`    ✓ [Done] ${btl.title || btl.name}: ${bcTodos.length} todos`);
          }
        }
      }
    }

    // ── Import Messages + Comments ──────────────────────────────────────
    if (mbDock) {
      const mb = await bc(mbDock.url);
      if (mb && mb.messages_url) {
        const bcMessages = await bcPaginated(mb.messages_url.replace('.json', '') + '.json');
        console.log(`  💬 ${bcMessages.length} messages`);

        for (const bm of bcMessages) {
          // Fetch full message to get content
          const fullMsg = await bc(`/buckets/${bp.id}/messages/${bm.id}.json`);
          const content = stripHtml(fullMsg?.content || bm.content || bm.title || '');

          const [message] = await insert('messages', [{
            project_id: project.id,
            title: bm.title || bm.subject || 'Untitled',
            content: content || '(no content)',
            created_by: USER_ID,
            created_at: bm.created_at,
            updated_at: bm.updated_at,
          }]);
          if (!message) continue;
          totalMessages++;

          // Fetch comments on this message
          if (fullMsg?.comments_url) {
            const bcComments = await bcPaginated(fullMsg.comments_url.replace('.json', '') + '.json');
            if (bcComments.length) {
              const commentRows = bcComments.map(c => ({
                message_id: message.id,
                content: stripHtml(c.content) || '(empty)',
                created_by: USER_ID,
                created_at: c.created_at,
                updated_at: c.updated_at,
              }));
              const ic = await insert('comments', commentRows);
              totalComments += ic?.length || 0;
            }
          }
        }
      }
    }
  }

  console.log('\n════════════════════════════════════════');
  console.log('Import complete!');
  console.log(`  Projects:    ${bcProjects.length}`);
  console.log(`  Todo lists:  ${totalTodoLists}`);
  console.log(`  Todos:       ${totalTodos}`);
  console.log(`  Messages:    ${totalMessages}`);
  console.log(`  Comments:    ${totalComments}`);
  console.log('════════════════════════════════════════');
}

main().catch(err => { console.error('Fatal error:', err); process.exit(1); });
