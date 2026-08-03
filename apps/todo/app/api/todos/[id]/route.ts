import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { tasks } from '@/lib/db/schema';
import { taskUpdateSchema } from '@/lib/validators';

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function resolveId(context: RouteContext): Promise<{ id: number } | { error: string; status: number }> {
  const params = await context.params;
  const rawId = Number(params.id);
  if (Number.isNaN(rawId)) {
    return { error: 'ID invalide', status: 400 };
  }
  return { id: rawId };
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const resolved = await resolveId(context);
    if ('error' in resolved) {
      return NextResponse.json({ error: resolved.error }, { status: resolved.status });
    }

    const task = db.select().from(tasks).where(eq(tasks.id, resolved.id)).get();

    if (!task) {
      return NextResponse.json({ error: 'Todo non trouvé' }, { status: 404 });
    }

    return NextResponse.json(task, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la récupération du todo' }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const resolved = await resolveId(context);
    if ('error' in resolved) {
      return NextResponse.json({ error: resolved.error }, { status: resolved.status });
    }

    const body = await request.json();
    const parsed = taskUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
    }

    const existing = db.select().from(tasks).where(eq(tasks.id, resolved.id)).get();
    if (!existing) {
      return NextResponse.json({ error: 'Todo non trouvé' }, { status: 404 });
    }

    const updated = db
      .update(tasks)
      .set(parsed.data)
      .where(eq(tasks.id, resolved.id))
      .returning()
      .get();

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour du todo' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const resolved = await resolveId(context);
    if ('error' in resolved) {
      return NextResponse.json({ error: resolved.error }, { status: resolved.status });
    }

    const existing = db.select().from(tasks).where(eq(tasks.id, resolved.id)).get();
    if (!existing) {
      return NextResponse.json({ error: 'Todo non trouvé' }, { status: 404 });
    }

    db.delete(tasks).where(eq(tasks.id, resolved.id)).run();

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la suppression du todo' }, { status: 500 });
  }
}
