'use client';
import Preview from "@/components/LivePreview";
import { Figure, parseTikzCode } from "@/lib/figures";
import { sendToQuickLaTeX } from "@/lib/quicklatex";
import {ReactElement, useEffect, useState} from "react";
// import Image from "next/image";
import AceEditor from "react-ace";

type Snapshot = {
    code: string;
    figure: Figure;
    imageUrl: string | Promise<string>;
};

function AsyncImg({src, alt}: {src : Promise<string>, alt: string})  {
  const [srcString, setSrcString] = useState<string | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    src
      .then(url => {
        if (mounted) setSrcString(url)
      })
      .catch(err => {
        console.error(err)
        if (mounted) setError('Failed to load image')
      })

    return () => {
      mounted = false
    }
  }, [src])

  if (error) return <div>{error}</div>
  if (src === undefined)   return <div>Loading…</div>

  return <img src={srcString} alt={alt} />
}

function SnapshotView({snapshot, load, decompose, explore, include}: {
    snapshot: Snapshot,
    load: (snapshot: Snapshot) => void,
    decompose: (snapshot: Snapshot) => void,
    explore: (snapshot: Snapshot) => void,
    include: (snapshot: Snapshot) => void,
}) {
    return <div className="aspect-3/2 border-2" onClick={() => decompose(snapshot)} onDoubleClick={() => load(snapshot)} onContextMenu={() => explore(snapshot)}> {/* TODO: also include `include` */}
        {(typeof(snapshot.imageUrl) == "string")
            ? <img src={snapshot.imageUrl} className="w-full h-full object-scale-down object-fit" />
            : <AsyncImg src={snapshot.imageUrl} alt={"/file.png"} />
        }
    </div>;
}

export default function Home() {

    const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
    // const [currentSnapshot, setCurrentSnapshot] = useState<Snapshot | undefined>(undefined);
    const [decomposing, setDecomposing] = useState<number>(-1);
    const [exploring, setExploring] = useState<ReactElement>();
    const [renderedCode, setRenderedCode] = useState('');
    const [editorCode, setEditorCode] = useState('');
    const [renderTimeout, setRenderTimeout] = useState<NodeJS.Timeout>();

    const editorFigure = parseTikzCode(editorCode);

    useEffect(() => {
        console.log('here is the current model value:', editorCode);
        clearTimeout(renderTimeout);
        setRenderTimeout(
            setTimeout(async () => {
                console.log("Rendering ...", {editorCode});
                setRenderedCode(editorCode);
            }, 500)
        );
    }, [editorCode])

    /* TODO: add functionality to transition from dark to light mode */

    function saveSnapshot(code: string, imageUrl: string | Promise<string>) {
        setSnapshots((oldSnapshots) => [{code: code, imageUrl: imageUrl, figure: parseTikzCode(code)}].concat(oldSnapshots));
        setDecomposing(-1);
    }

    function loadCode(code: string) {
        setEditorCode(code);
        setDecomposing(-1);
        setExploring(undefined);
    }

    function decompose(snapshot: Snapshot) {
        console.log("decomposing ...")
        const subshots: Snapshot[] = snapshot.figure.decompose().map((fig) => {
            return {
                code: fig.toString(),
                imageUrl: sendToQuickLaTeX(fig.toString()),
                figure: fig
            }
        });
        const subshotsContainer = <div className="block">
            <div className="grid grid-cols-3 gap-4">
                {subshots.map((subshot, idx) => <SnapshotView
                    key={idx}
                    snapshot={subshot}
                    load={(snapshot: Snapshot) => setEditorCode(snapshot.code)}
                    decompose={() => {}} // no-op
                    explore={() => explore(subshot)}
                    include={() => loadCode(editorCode + "\n" + subshot.code)}
                />)}
            </div>
        </div>;

        return subshotsContainer;
    }

    function explore(snapshot: Snapshot) {
        console.log("exploring ...", snapshot.figure, snapshot.figure.explore())
        const subshots: Snapshot[] = snapshot.figure.explore().map((fig) => {
            return {
                code: fig.toString(),
                imageUrl: sendToQuickLaTeX(fig.toString()),
                figure: fig
            }
        });
        console.log(subshots);
        const subshotsContainer = <div className="block">
            <div className="grid grid-cols-4 gap-4">
                {subshots.map((subshot, idx) => <SnapshotView
                    key={idx}
                    snapshot={subshot}
                    load={(snapshot: Snapshot) => setEditorCode(snapshot.code)}
                    decompose={() => {}} // TODO: no-op
                    explore={() => explore(subshot)}
                    include={() => loadCode(editorFigure.compose(subshot.figure).toString())}
                />)}
            </div>
        </div>;

        return subshotsContainer;
    }

    return (
        <>
            {Boolean(exploring) &&
                <div className="">
                    {exploring}
                </div>}
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
                      onClick={() => exportCode(editorCode)}
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
                    value={editorCode}
                    onChange={(value) => setEditorCode(value)}
                    height="50vh"
                />
                <Preview
                    code={renderedCode}
                    save={saveSnapshot}
                />
                <div className="row-span-15 row-start-1 col-start-2 border-1 w-50%">
                    {/* <div className="float-start col-span-2 h-8">snapshots</div> */}
                    <div className="m-4 grid flex grid-cols-3 flex-row gap-4">
                        {snapshots.map((snapshot, idx) => <>
                            <SnapshotView
                                key={idx}
                                snapshot={snapshot}
                                load={() => loadCode(snapshot.code)}
                                decompose={() => setDecomposing(idx)}
                                explore={() => setExploring(explore(snapshot))}
                                include={() => loadCode(editorCode + "\n" + snapshot.code)}
                            />
                            {decomposing === idx && decompose(snapshot)}
                        </>)}
                        {/* snapshot history goes here */}
                    </div>
                </div>
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
