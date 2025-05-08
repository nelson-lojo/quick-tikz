// quicklatex.ts
// This module provides a function to send LaTeX code to the QuickLaTeX API
// and retrieve the generated image URL. It uses the Fetch API to make a POST request
// to the QuickLaTeX service with the LaTeX code and some additional parameters.
// The function is asynchronous and returns a Promise that resolves to the image URL.



/*this function sends text to the quicklatex api and returns the image url*/
async function sendToQuickLaTeX(tex: string): Promise<string> {  // URL-encode the LaTeX formula
  const response = await fetch('https://quicklatex.com/latex3.f', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      formula: tex,
      fsize: '17px',
      fcolor: '000000',
      mode: '0',
      out: '1',
      remhost: 'quicklatex.com',
      preamble: `\\usepackage{amsmath}
      \\usepackage{amssymb}
      \\usepackage{amsfonts}`,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate LaTeX image');
  }

  const raw = await response.text();
  const data = raw.trim();
  // QuickLaTeX sometimes returns status first or URL first
  const parts = data.split(/\s+/);
  if (parts[0] === '0') {
    // standard: [status, url, ...]
    return parts[1];
  } else if (parts[1] === '0') {
    // alternate: [url, status, ...]
    return parts[0];
  }
  throw new Error('QuickLaTeX error: ' + data);
}

const teststr:string = '$\\sum\\limits_i^\\infty$';
sendToQuickLaTeX(teststr)
  .then(url => console.log('Image URL:', url))
  .catch(err => console.error(err));