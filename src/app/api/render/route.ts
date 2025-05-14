import { NextRequest, NextResponse } from 'next/server';
import tex2svg from 'node-tikzjax';

export async function GET(req: NextRequest) {
  // load the document from the URL (so that it can be a `src` attribute of an <img> tag)
  const latexEnc = req.nextUrl.searchParams.get('latex');
  if (latexEnc === null)
    return NextResponse.json({ error: 'No Latex query parameter provided' }, { status: 500 });
  const latexDoc = atob(latexEnc);

  let svg = "";
  try {
    
    svg = await tex2svg(latexDoc, {
      texPackages: { pgfplots: '', amsmath: '', amsfonts: '', amssymb: '', tikz: '' },
      tikzLibraries: 'arrows.meta,calc',
    });
  } catch (error) {
    return new NextResponse('Failed to generate LaTeX image', { status: 500 });
  }

  return new NextResponse(svg);
}
