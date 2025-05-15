import { Figure, parseTikzCode } from "@/lib/figures";
import { useEffect, useState } from "react";

const IMPORTS = `\\usepackage{amsmath}
\\usepackage{amsfonts}
\\usepackage{amssymb}
\\usepackage{tikz}
\\usetikzlibrary{calc}`

export default function Preview({code, save}: {
    code: string | undefined,
    save: (code: string, imageUrl: string) => void,
}) {
    console.log('rendering Preview');

    // const [imgTag, setImgTag] = useState<ReactElement>(
    //     <img src="/file.svg" className="object-fit"/>
    // );
    const [imgUrl, setImgURL] = useState<string | undefined>("/file.svg");

    async function sendToQuickLaTeX(tex: string): Promise<string> {
        const params = {
            'formula': tex,
            'fsize': '17px',
            'fcolor': '000000',
            'mode': '0',
            'out': '1',
            'remhost': 'quicklatex.com',
            'preamble': IMPORTS,
            'rnd':  (Math.random() * (100 - 1) + 1).toString(),
        };
        // write the params as a URL query 
        const formBody = Object.entries(params)
            .map(([key, value]) => key + '=' + value)
            .join('&');

        const response = await fetch('/api/quicklatex', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formBody
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
        <img src={imgUrl} className="w-full h-full object-fit" />;


    useEffect(() => {
        if (code === undefined || code === "") {
            // Keep default image for empty code
        } else {
            // Show loading state
            // setImgTag(<div>Rendering TikZ...</div>);
            setImgURL(undefined);

            // Create the full LaTeX code with tikzpicture environment
            const tikzCode = `\\begin{tikzpicture}\n${code}\n\\end{tikzpicture}`;

            // // // testing parsing
            // console.log("Parsed TikZ code:", parseTikzCode(code).toString());

            // // // testing converting back to code
            // console.log("Converted back to code:", parseTikzCode(code).toCode());

            // testing decomposing figures
            // const figure = parseTikzCode(code);
            // const figures = figure.decompose();
            // console.log("Decomposed figures:", figures.map(f => f.toCode()));
            // // testing combining figures
            // const combinedFigure = Figure.combine(figures);
            // console.log("Combined figure:", combinedFigure.toCode());

            // // testing exploring figures
            // const exploredFigures = figure.explore(2);
            // console.log("Explored figures:", exploredFigures.map(f => f.toCode()));



            // Send to QuickLaTeX and update image when done
            console.log("Sending to QuickLaTeX:", tikzCode);
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
            <div className="float-right flex gap-4">
                <button onClick={() => exportCode(code)}>
                    <img src="/export.svg" className="h-[5vh]"/>
                </button>
                <button onClick={() => saveWrapper()}>
                    <img src="/window.svg" className="h-[5vh]"/>
                </button>
            </div>
            <div className="flex justify-center h-[40vh]">
                {imgTag}
            </div>
        </div>;
}
