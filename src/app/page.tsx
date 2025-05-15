'use client';
import {EventHandler, ReactElement, useEffect, useRef, useState} from "react";
// import Image from "next/image";
import AceEditor from "react-ace";

const IMPORTS = `
\\usepackage{amsmath}
\\usepackage{amsfonts}
\\usepackage{amssymb}
\\usepackage{tikz}
\\usetikzlibrary{calc}
`

type Snapshot = {
    code: string;
    imageUrl: string;
};

// set of valid tikz colors
const COLORS = ['red', 'green', 'blue', 'yellow', 'cyan', 'magenta', 'black', 'white', 'gray', 'orange', 'purple', 'brown', 'pink', 'teal', 'violet', 'lime', 'olive', 'navy', 'maroon', 'silver', 'gold'];
//set of valid tikz line widths
const LINE_WIDTHS = ['ultra thin', 'very thin', 'thin', 'semithick', 'thick', 'very thick', 'ultra thick'];
//set of valid tikz line styles
const SOLID = ['solid', 'dashed', 'dotted', 'dash dotted',  'loosely dotted', 'loosely dashdotted', 'densely dashed', 'densely dotted', 'densely dashdotted'];

class FigAttribute {
  name: string;
  value: string;
  constructor(name: string, value: string) {
    this.name = name;
    this.value = value;
  }
  toString(): string {
    return JSON.stringify({ name: this.name, value: this.value });
  }
}

// class that extends FigAttribute to an "explorable" attribute it has an extra field attribute type which could be a color, line width, or line style etc. 
// it inherits the toString method from FigAttribute
class FigAttributeExplorable extends FigAttribute {
    attributeType: string;
    constructor(name: string, value: string, attributeType: string) {
        super(name, value);
        this.attributeType = attributeType;
    }
    genVariants(breadth: number = 3): FigAttributeExplorable[] {
        const variants: FigAttributeExplorable[] = [];
        const allVariants = this.attributeType === 'color'
            ? COLORS
            : this.attributeType === 'line width'
                ? LINE_WIDTHS
                : SOLID;
        const currentValue = this.value;
        // filter out current value
        const candidates = allVariants.filter(v => v !== currentValue);
        // determine how many variants to generate
        const count = Math.min(breadth, candidates.length);
        // randomly select 'count' distinct variants
        for (let i = 0; i < count; i++) {
            const idx = Math.floor(Math.random() * candidates.length);
            const val = candidates.splice(idx, 1)[0];
            variants.push(new FigAttributeExplorable(this.name, val, this.attributeType));
        }
        return variants;
    }

    }

class FigElement {
  command: string;
  attributes: FigAttribute[];
  body: string;
  constructor(command: string, attributes: FigAttribute[], body: string) {
    this.command = command;
    this.attributes = attributes;
    this.body = body;
  }
  toString(): string {
    return JSON.stringify({
      command: this.command,
      attributes: this.attributes.map(attr => JSON.parse(attr.toString())),
      body: this.body
    });
  }
}

class Figure {
  commands: FigElement[];
  constructor(commands: FigElement[]) {
    this.commands = commands;
  }
  toString(): string {
    return JSON.stringify({
      commands: this.commands.map(elem => JSON.parse(elem.toString()))
    }, null, 2);
  }
  toCode(): string {
    return this.commands.map(elem => {
      if (elem.attributes.length > 0) {
        const attrString = elem.attributes
          .map(attr => `${attr.name}=${attr.value}`)
          .join(',');
        return `\\${elem.command}[${attrString}] ${elem.body};`;
      } else {
        return `\\${elem.command} ${elem.body};`;
      }
    }).join('\n');
  }
  compose(other: Figure): Figure {
    return new Figure([...this.commands, ...other.commands]);
  }

  decompose(): Figure[] {
    return this.commands.map(cmd => new Figure([cmd]));
  }
  explore(breadth: number = 3): Figure[] {
        const figures: Figure[] = [];
        // helper to deep-clone commands and attributes
        const cloneCommands = (commands: FigElement[]) => 
            commands.map(cmd =>
                new FigElement(
                    cmd.command,
                    cmd.attributes.map(a =>
                        a instanceof FigAttributeExplorable
                            ? new FigAttributeExplorable(a.name, a.value, a.attributeType)
                            : new FigAttribute(a.name, a.value)
                    ),
                    cmd.body
                )
            );
        // original figure
        figures.push(new Figure(cloneCommands(this.commands)));
        // variants for each explorable attribute
        this.commands.forEach((cmd, cmdIdx) => {
            cmd.attributes.forEach((attr, attrIdx) => {
                if (attr instanceof FigAttributeExplorable) {
                    const variants = attr.genVariants(breadth);
                    variants.forEach(variant => {
                        const newCommands = cloneCommands(this.commands);
                        // replace only the targeted attribute
                        newCommands[cmdIdx].attributes[attrIdx] = variant;
                        figures.push(new Figure(newCommands));
                    });
                }
            });
        });
        return figures;
    }

  static combine(figures: Figure[]): Figure {
    return figures.reduce(
      (acc, fig) => acc.compose(fig),
      new Figure([])
    );
    }
}


// function parses the tikz code and returns a Figure object
function parseTikzCode(code: string): Figure {
  const lines = code.split(';').map(l => l.trim()).filter(l => l.length > 0);
  const commands: FigElement[] = lines.map(line => {
    // Extract command name (e.g., draw, filldraw, shade)
    const cmdMatch = line.match(/^\\(\w+)/);
    const command = cmdMatch ? cmdMatch[1] : '';
    let attributes: FigAttribute[] = [];
    let body = '';
    // Parse attributes inside [ ... ]
    const attrMatch = line.match(/\[([^\]]+)\]/);
    if (attrMatch) {
      const attrString = attrMatch[1];
      const parts = attrString.split(',').map(s => s.trim()).filter(s => s);
      parts.forEach(part => {
        if (part.includes('=')) {
          const [rawName, rawValue] = part.split(/=(.+)/);
          const name = rawName.trim();
          const value = rawValue.trim();
          if (name.toLowerCase().includes('color')) {
            attributes.push(new FigAttributeExplorable(name, value, 'color'));
          } else if (name.toLowerCase().includes('width')) {
            attributes.push(new FigAttributeExplorable(name, value, 'line width'));
          } else if (name.toLowerCase().includes('solid')) {
            attributes.push(new FigAttributeExplorable(name, value, 'solid'));
          } else {
            attributes.push(new FigAttribute(name, value));
          }
        } else if (COLORS.includes(part)) {
          attributes.push(new FigAttributeExplorable('color', part, 'color'));
        } else if (LINE_WIDTHS.includes(part)) {
          attributes.push(new FigAttributeExplorable('line width', part, 'line width'));
        } else if (SOLID.includes(part)) {
          attributes.push(new FigAttributeExplorable('solid', part, 'solid'));
        }
      });
      body = line.slice(line.indexOf(']') + 1).trim();
    } else {
      // No attribute brackets: body is after the command name
      body = line.slice(line.indexOf(command) + command.length + 1).trim();
    }
    return new FigElement(command, attributes, body);
  });
  return new Figure(commands);
}


// Function to export the code as a .tex file
// This function creates a Blob from the code and triggers a download
// adds the tikzpicture environment
// function exportCode(code: string | undefined) {
//     if (code) {
//         const tikzCode = `\\begin{tikzpicture}\n${code}\n\\end{tikzpicture}`;
//         const blob = new Blob([tikzCode], {type: 'text/plain'});
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement('a');
//         a.href = url;
//         a.download = 'quick_tikz_code.tex';
//         a.click();
//         URL.revokeObjectURL(url);
//     }
// }

// function to export the code to the clipboard
function exportCode(code: string | undefined) {
    if (code) {
        const tikzCode = `\\begin{tikzpicture}\n${code}\n\\end{tikzpicture}`;
        navigator.clipboard.writeText(tikzCode)
            .then(() => {
                console.log('Code copied to clipboard');
            })
            .catch(err => {
                console.error('Failed to copy code: ', err);
            });
    }
}

function SnapshotView({snapshot}: {
    snapshot: Snapshot
    load: (snapshot: Snapshot) => void,
}) {
    return <div className="w-4 border-1">
        <img src={snapshot.imageUrl} className="object-fit" />
    </div>;
}

function Preview({code, save}: {
    code: string | undefined,
    save: (code: string, imageUrl: string) => void,
}) {
    console.log('rendering Preview');

    // const [imgTag, setImgTag] = useState<ReactElement>(
    //     <img src="/file.svg" className="object-fit"/>
    // );
    const [imgUrl, setImgURL] = useState<string | undefined>("/file.svg");

    async function sendToQuickLaTeX(tex: string): Promise<string> {
        const params = new URLSearchParams({
            'formula': tex,
            'fsize': '17px',
            'fcolor': '000000',
            'mode': '0',
            'out': '1',
            'remhost': 'quicklatex.com',
            'preamble': IMPORTS
        });

        const response = await fetch('/api/quicklatex', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params
        });

        if (!response.ok) {
            throw new Error('Failed to generate LaTeX image');
        }

        const result = await response.json();
        const data = result.data.trim();
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

    const imgTag = imgUrl === undefined ?
        <div>Rendering TikZ...</div> :
        <img src={imgUrl} className="object-fit" />;


    useEffect(() => {
        if (code === undefined || code === "") {
            // Keep default image for empty code
        } else {
            // Show loading state
            // setImgTag(<div>Rendering TikZ...</div>);
            setImgURL(undefined);

            // Create the full LaTeX code with tikzpicture environment
            const tikzCode = `\\begin{tikzpicture}${code}\\end{tikzpicture}`;

            // // testing parsing
            console.log("Parsed TikZ code:", parseTikzCode(code).toString());

            // // testing converting back to code
            console.log("Converted back to code:", parseTikzCode(code).toCode());

            // testing decomposing figures
            const figure = parseTikzCode(code);
            const figures = figure.decompose();
            console.log("Decomposed figures:", figures.map(f => f.toCode()));
            // testing combining figures
            const combinedFigure = Figure.combine(figures);
            console.log("Combined figure:", combinedFigure.toCode());

            // testing exploring figures
            const exploredFigures = figure.explore(2);
            console.log("Explored figures:", exploredFigures.map(f => f.toCode()));



            // Send to QuickLaTeX and update image when done
            sendToQuickLaTeX(tikzCode)
                .then(imageUrl => {
                    console.log("Image URL:", imageUrl);
                    // Set the image tag with the received URL
                    // setImgTag(<img src={imageUrl} className="object-fit" alt="TikZ diagram"/>);
                    setImgURL(imageUrl);
                })
                .catch(error => {
                    console.error("Rendering error:", error);
                    // setImgTag(<div className="text-red-500">Error rendering TikZ: {error.message}</div>);
                    setImgURL("/file.svg");
                });
        }
    }, [code]);

    function saveWrapper() {
        if (code === undefined || code === "" || imgUrl === undefined) {
            // don't save if nothing to save yet
        } else {
            save(code, imgUrl);
        }
    }

    return <div
            id="preview-container"
            className="row-span-6 col-start-1 border-1"
        >
            <div className="float-right">
                <button onClick={() => saveWrapper()}>
                    <img src="/window.svg" className="h-[5vh]"/>
                </button>
            </div>
            <div className="float-right">
                <button onClick={() => exportCode(code)}>
                    <img src="/export.svg" className="h-[5vh]"/>
                </button>
            </div>
            <div className="flex justify-center h-[40vh]">
                {imgTag}
            </div>
        </div>;
}

export default function Home() {

    const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
    // const [currentSnapshot, setCurrentSnapshot] = useState<Snapshot | undefined>(undefined);
    const [currentCode, setCurrentCode] = useState('');
    const [renderTimeout, setRenderTimeout] = useState<NodeJS.Timeout>();

    function handleEditorChange(value: string) {
        console.log('here is the current model value:', value);
        clearTimeout(renderTimeout);
        setRenderTimeout(
            setTimeout(async () => {
                console.log("Rendering ...", {value});
                setCurrentCode(value);
            }, 500)
        );
    }
    /* TODO: add functionality to transition from dark to light mode */

    function saveSnapshot(code: string, imageUrl: string) {
        setSnapshots((oldSnapshots) => [{code: code, imageUrl: imageUrl}].concat(oldSnapshots));
    }

    function loadSnapshot(snapshot: Snapshot) {
        setCurrentCode(snapshot.code);
    }

    console.log("rendering Home");

    return (
        <>
            {/* <div className="grid grid-rows-2 items-left justify-items-left font-[family-name:var(--font-geist-sans)]"> */}
            <main className="grid flex flex-row">
                <div className="font-mono flex border-1">
                    <button
                        type="button"
                        className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc] m-2"
                    >
                        <div className="p-1">
                            TikZ
                        </div>
                    </button>
                    {/* <button
                        type="button"
                        className="rounded-full border border-solid m-2"
                    >
                        <div className="p-1">
                            circuitikz
                        </div>
                    </button> */}
                    <button
                      type="button"
                      className="m-2 ml-auto"
                      onClick={() => exportCode(currentCode)}
                    >
                      <div className="p-1 flex items-center">
                        <img src="/export.svg" className="h-[3vh] mr-1" />
                      </div>
                    </button>
                </div>
                <AceEditor
                    className="row-span-8 col-start-1 font-mono resize-none border-1"
                    name="code-editor"
                    width="50"
                    onChange={handleEditorChange}
                    height="50vh"
                />
                <Preview
                    code={currentCode}
                    save={saveSnapshot}
                    // sendToQuickLaTeX={sendToQuickLaTeX}
                    // exportCode={exportCode}
                />
                <div
                    className="row-span-15 row-start-1 col-start-2 border-1 grid flex-row"
                >
                    snapshots
                    {snapshots.map((snapshot, idx) => <SnapshotView
                        key={idx}
                        snapshot={snapshot}
                        load={loadSnapshot}
                    />)}
                    {/* snapshot history goes here */}
                </div>
                {/* <ol className="list-inside list-decimal text-sm/6 text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
                    <li className="mb-2 tracking-[-.01em]">
                        Get started by editing{" "}
                        <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-[family-name:var(--font-geist-mono)] font-semibold">
                            src/app/page.tsx
                        </code>
                        .
                    </li>
                    <li className="tracking-[-.01em]">
                        Save and see your changes instantly.
                    </li>
                </ol> */}
            </main>
            <footer className="flex gap-[24px] flex-wrap items-center justify-center">
                <a className="flex items-center gap-2 hover:underline hover:underline-offset-4">
                    Check Us Out!
                </a>
                <a className="flex items-center gap-2 hover:underline hover:underline-offset-4">
                    Examples
                </a>
            </footer>
            {/* </div> */}
        </>
    );
}
