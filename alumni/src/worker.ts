/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
  // Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
  // MY_KV_NAMESPACE: KVNamespace;
  //
  // Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
  // MY_DURABLE_OBJECT: DurableObjectNamespace;
  //
  // Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
  // MY_BUCKET: R2Bucket;
  //
  // Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
  // MY_SERVICE: Fetcher;
  //
  // Example binding to a Queue. Learn more at https://developers.cloudflare.com/queues/javascript-apis/
  // MY_QUEUE: Queue;
  DB: D1Database;
}

// What do we want to do?
//
// - We want to record the tickets, possibly during the event.
// - We want to list people who have not checked-in yet and search for people.
// - We want to check people in.

interface Ticket {
  firstName: string;
  lastName: string;
}

interface CheckIn {
  ticketId: number;
}

function parseTicket(params: any): Ticket | undefined {
  if (params?.first_name && params?.last_name) {
    return { firstName: params.first_name, lastName: params.last_name };
  }
  return undefined;
}

function parseCheckIn(params: any): CheckIn | undefined {
  if (params?.ticket_id) {
    return { ticketId: params.ticket_id };
  }
  return undefined;
}

async function insertTicket(request: Request, env: Env) {
  const ticket = parseTicket(await request.json());
  if (!ticket) return new Response("Invalid ticket data", { status: 422 });

  await env.DB.prepare(
    `insert into tickets (first_name, last_name)
                      values (?, ?);`,
  )
    .bind(ticket.firstName, ticket.lastName)
    .run();
}

async function listTickets(request: Request, env: Env) {
  const { results } = await env.DB.prepare(
    `select id,
            first_name,
            last_name,
            datetime(check_ins.created_at, 'localtime') as checked_in_at
       from tickets
            left join check_ins
                   on tickets.id = check_ins.ticket_id;`,
  ).all();
  const response = Response.json(results);
  response.headers.append("Access-Control-Allow-Origin", "*");
  return response;
}

async function checkIn(request: Request, env: Env) {
  const checkIn = parseCheckIn(await request.json());
  if (!checkIn) return new Response("Invalid check in data", { status: 422 });
  try {
    await env.DB.prepare(
      `insert into check_ins (ticket_id, created_at)
							values (?, datetime('now'));`,
    )
      .bind(checkIn.ticketId)
      .run();
    const response = new Response();
    response.headers.append("Access-Control-Allow-Origin", "*");
    return response;
  } catch (e: any) {
    if (e.message.includes("UNIQUE constraint failed")) {
      return new Response("Ticket already checked in", { status: 403 });
    }
    throw e;
  }
}

const routes = new Map();
routes.set("/tickets@POST", insertTicket);
routes.set("/tickets@GET", listTickets);
routes.set("/check_in@POST", checkIn);

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);
    const handler = routes.get([url.pathname, request.method].join("@"));
    if (!handler) return new Response("Route not found", { status: 404 });
    return await handler(request, env, ctx);
  },
};
