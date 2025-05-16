'use client';
import Preview from "@/components/LivePreview";
import { Figure, parseTikzCode } from "@/lib/figures";
import { sendToQuickLaTeX } from "@/lib/quicklatex";
import {ReactElement, useEffect, useState} from "react";
// import Image from "next/image";
import AceEditor from "react-ace";
import { useAuth } from "@/contexts/AuthContext";

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
    const { user, signOut } = useAuth();
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
                code: fig.toCode(),
                imageUrl: sendToQuickLaTeX(fig.toCode()),
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
                code: fig.toCode(),
                imageUrl: sendToQuickLaTeX(fig.toCode()),
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
                    include={() => loadCode(editorFigure.compose(subshot.figure).toCode())}
                />)}
            </div>
        </div>;

        return subshotsContainer;
    }

    return (
        <div className="h-screen flex flex-col">
            <header className="flex-none p-2 bg-black text-white">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold">Quick TikZ</h1>
                    <div className="font-mono flex items-center gap-4">
                        {user && (
                          <span className="text-sm">Welcome, {user.email}</span>
                        )}
                        <button
                            type="button"
                            className="rounded-full border border-solid border-white transition-colors flex items-center justify-center hover:bg-white hover:text-black px-3 py-1"
                        >
                            <div className="text-sm">
                                TikZ
                            </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => exportCode(editorCode)}
                          className="hover:opacity-80"
                        >
                          <div className="flex items-center">
                            <img src="/export.svg" className="h-5 invert" />
                          </div>
                        </button>
                        {user && (
                          <button
                            type="button"
                            onClick={signOut}
                            className="ml-2 px-3 py-1 rounded bg-white text-black text-sm font-semibold hover:bg-gray-200 transition-colors"
                          >
                            Sign Out
                          </button>
                        )}
                    </div>
                </div>
            </header>
            <main className="flex-1 flex gap-2 p-2 overflow-hidden">
                <div className="w-2/3 flex flex-col h-full min-h-0 relative overflow-hidden">
                    <div className="flex-1 min-h-0 w-full">
                        <AceEditor
                            className="h-full w-full font-mono resize-none border-1"
                            name="code-editor"
                            value={editorCode}
                            onChange={(value) => setEditorCode(value)}
                            height="100%"
                            width="100%"
                        />
                    </div>
                    <div className="flex-1 min-h-0 w-full">
                        <Preview
                            code={renderedCode}
                            save={saveSnapshot}
                        />
                    </div>
                </div>
                <div className="w-1/3 border-1 overflow-hidden">
                    <div className="grid grid-cols-3 grid-rows-2 gap-2 p-2 h-full">
                        {snapshots.slice(0, 6).map((snapshot, idx) => <> <SnapshotView
                                key={idx}
                                snapshot={snapshot}
                                load={() => loadCode(snapshot.code)}
                                decompose={() => setDecomposing(idx)}
                                explore={() => setExploring(explore(snapshot))}
                                include={() => loadCode(editorCode + "\n" + snapshot.code)}
                            />
                        {decomposing === idx && decompose(snapshot)}
                        </>)}
                    </div>
                </div>
            </main>
            <footer className="flex-none flex gap-4 items-center justify-center p-1 border-t">
                <a className="flex items-center gap-2 hover:underline hover:underline-offset-4 text-xs">
                    Check Us Out!
                </a>
                <a className="flex items-center gap-2 hover:underline hover:underline-offset-4 text-xs">
                    Examples
                </a>
            </footer>
        </div>
    );
}
