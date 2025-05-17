const IMPORTS = `\\usepackage{amsmath}
\\usepackage{amsfonts}
\\usepackage{amssymb}
\\usepackage{tikz}
\\usetikzlibrary{calc}`;

export async function sendToQuickLaTeX(tex: string): Promise<string> {
//  tex = `\\begin{tikzpicture}\n${tex}\n\\end{tikzpicture}`
  console.log("Sending to QuickLaTeX:", tex);
  const params = {
    formula: tex,
    fsize: "17px",
    fcolor: "000000",
    mode: "0",
    out: "1",
    remhost: "quicklatex.com",
    preamble: IMPORTS,
    rnd: (Math.random() * (100 - 1) + 1).toString(),
  };
  // write the params as a URL query
  const formBody = Object.entries(params)
    .map(([key, value]) => key + "=" + value)
    .join("&");

  const response = await fetch("/api/quicklatex", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formBody,
  });

  if (!response.ok) {
    throw new Error("Failed to generate LaTeX image");
  }

  const result = await response.json();
  const data = result.data.trim();
  const parts = data.split(/\s+/);

  if (parts[0] === "0") {
    // standard: [status, url, ...]
    return parts[1];
  } else if (parts[1] === "0") {
    // alternate: [url, status, ...]
    return parts[0];
  }
  throw new Error("QuickLaTeX error: " + data);
}
