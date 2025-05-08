import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // Get the raw form data as text
  const formData = await req.text();
  
  // Forward request to QuickLaTeX
  const response = await fetch('https://quicklatex.com/latex3.f', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData
  });
  
  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to generate LaTeX image' }, { status: 500 });
  }
  
  const data = await response.text();
  return NextResponse.json({ data });
}