import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET() {
  try {
    const tasksFilePath = join(
      process.cwd(),
      '.taskmaster',
      'tasks',
      'tasks.json',
    );
    const fileContent = await readFile(tasksFilePath, 'utf-8');
    const tasksData = JSON.parse(fileContent);

    return NextResponse.json(tasksData);
  } catch (error) {
    console.error('Error reading tasks file:', error);
    return NextResponse.json(
      { error: 'Failed to load tasks' },
      { status: 500 },
    );
  }
}
