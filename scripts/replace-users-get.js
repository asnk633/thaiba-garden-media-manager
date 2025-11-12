/**
 * replace-users-get.js
 * Usage: node scripts/replace-users-get.js
 *
 * This script finds the "export async function GET(...)" function in
 * src/app/api/users/route.ts and replaces it with a safer implementation.
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'api', 'users', 'route.ts');
if (!fs.existsSync(filePath)) {
  console.error('File not found:', filePath);
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

// find start of GET function
const startRegex = /export\s+async\s+function\s+GET\s*\(\s*req\s*:\s*Request\s*\)\s*{/m;
const startMatch = content.match(startRegex);
if (!startMatch) {
  console.error('Could not find "export async function GET(req: Request) {" in the file.');
  process.exit(1);
}

const startIndex = content.indexOf(startMatch[0]);
let i = startIndex + startMatch[0].length;
let braceCount = 1; // we've seen the opening '{' from the match

// walk forward to find matching closing brace for the function
while (i < content.length && braceCount > 0) {
  const ch = content[i];
  if (ch === '{') braceCount++;
  else if (ch === '}') braceCount--;
  i++;
}

if (braceCount !== 0) {
  console.error('Failed to find the end of the GET function (brace mismatch). Aborting.');
  process.exit(1);
}

const endIndex = i; // position after the matching closing brace

// new GET implementation (keeps Response usage, safe conditions)
const newGet = `
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q") ?? "";
    const limit = Number(url.searchParams.get("limit") ?? 10);

    // Build conditions safely
    const conditions: any[] = [];
    const searchTerm = typeof q === "string" ? q.trim() : "";

    if (searchTerm.length > 0) {
      const likePattern = \`%\${searchTerm}%\`;
      // NOTE: using column.like(...) — if your Drizzle version requires a different helper,
      // replace (users.full_name as any).like(...) with like(users.full_name, likePattern)
      conditions.push(
        or(
          (users.full_name as any).like(likePattern),
          (users.email as any).like(likePattern)
        )
      );
    }

    // Example: add more filters if needed:
    // const role = url.searchParams.get('role');
    // if (role) conditions.push(eq(users.role, role));

    let query = db
      .select()
      .from(users)
      .orderBy(desc(users.created_at))
      .limit(limit);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const usersList = await query;

    return new Response(JSON.stringify({
      success: true,
      count: usersList.length,
      data: usersList
    }), { status: 200 });
  } catch (error) {
    console.error("GET /api/users failed:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}
`;

// replace old function with newGet
const newContent = content.slice(0, startIndex) + newGet + content.slice(endIndex);

// write file
fs.writeFileSync(filePath, newContent, 'utf8');
console.log('Replaced GET handler in', filePath);
