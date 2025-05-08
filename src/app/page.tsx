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
    // image: ReactElement;
};

function Preview({code, save, sendToQuickLaTeX, exportCode}: {
    code: string | undefined,
    save: (_: string | undefined) => void,
    sendToQuickLaTeX: (tex: string) => Promise<string>,
    exportCode: (_: string | undefined) => void
}) {
    console.log('rendering Preview');

    const [imgTag, setImgTag] = useState<ReactElement>(
        <img src="/file.svg" className="object-fit"/>
    );

    useEffect(() => {
        if (code === undefined || code === "") {
            // Keep default image for empty code
        } else {
            // Show loading state
            setImgTag(<div>Rendering TikZ...</div>);

            // Create the full LaTeX code with tikzpicture environment
            const tikzCode = `\\begin{tikzpicture}${code}\\end{tikzpicture}`;

            // Send to QuickLaTeX and update image when done
            sendToQuickLaTeX(tikzCode)
                .then(imageUrl => {
                    console.log("Image URL:", imageUrl);
                    // Set the image tag with the received URL
                    setImgTag(<img src={imageUrl} className="object-fit" alt="TikZ diagram"/>);
                })
                .catch(error => {
                    console.error("Rendering error:", error);
                    setImgTag(<div className="text-red-500">Error rendering TikZ: {error.message}</div>);
                });
        }
    }, [code, sendToQuickLaTeX]);

    return <div
        id="preview-container"
        className="row-span-6 col-start-1 border-1"
    >
        <div className="float-right">
            <button onClick={() => save(code)}>
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
    </div>
}

export default function Home() {

    const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
    const [currentSnapshot, setCurrentSnapshot] = useState<Snapshot | undefined>(undefined);
    // const [currentCode, setCurrentCode] = useState('');
    const [renderTimeout, setRenderTimeout] = useState<NodeJS.Timeout>();

    function handleEditorChange(value: string) {
        console.log('here is the current model value:', value);
        clearTimeout(renderTimeout);
        setRenderTimeout(
            setTimeout(async () => {
                console.log("Rendering ...", {value});
                setCurrentSnapshot({
                    code: value,
                    // image: imageTag
                })
            }, 500)
        );
    }
   /* TODO: add functionality to transition from dark to light mode */
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


    function saveSnapshot(code: string | undefined) {
        if (code) {
            setSnapshots((oldSnapshots) => [{code: code}].concat(oldSnapshots));
        } else {
            console.log("NOPE")
        }
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
                    <button
                        type="button"
                        className="rounded-full border border-solid m-2"
                    >
                        <div className="p-1">
                            circuitikz
                        </div>
                    </button>
                    <button
                      type="button"
                      className="m-2 ml-auto"
                      onClick={() => exportCode(currentSnapshot?.code)}
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
                    code={currentSnapshot?.code}
                    save={saveSnapshot}
                    sendToQuickLaTeX={sendToQuickLaTeX}
                    exportCode={exportCode}
                />
                <div
                    className="row-span-15 row-start-1 col-start-2 border-1 grid flex-row"
                >
                    snapshots
                    {snapshots.map((snapshot, idx) => <div
                        key={idx}
                        className="w-4"
                    >
                        // TODO: render snapshot history
                    </div>)}
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
