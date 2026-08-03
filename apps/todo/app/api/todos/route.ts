import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { tasks } from '@/lib/db/schema';
import { taskInsertSchema } from '@/lib/validators';

export async function GET() {
  try {
    const allTasks = db.select().from(tasks).all();
    return NextResponse.json(allTasks, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la récupération des todos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = taskInsertSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
    }

    const inserted = db
      .insert(tasks)
      .values(parsed.data)
      .returning()
      .get();

    return NextResponse.json(inserted, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la création du todo' }, { status: 500 });
  }
}
