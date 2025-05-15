'use client';
import Preview from "@/components/LivePreview";
import {useEffect, useState} from "react";
// import Image from "next/image";
import AceEditor from "react-ace";

type Snapshot = {
    code: string;
    imageUrl: string;
};

function SnapshotView({snapshot, load}: {
    snapshot: Snapshot
    load: (snapshot: Snapshot) => void,
}) {
    return <div className="aspect-3/2 border-2" onDoubleClick={() => load(snapshot)}>
        <img src={snapshot.imageUrl} className="w-full h-full object-scale-down object-fit" />
    </div>;
}

export default function Home() {

    const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
    // const [currentSnapshot, setCurrentSnapshot] = useState<Snapshot | undefined>(undefined);
    const [renderedCode, setRenderedCode] = useState('');
    const [editorCode, setEditorCode] = useState('');
    const [renderTimeout, setRenderTimeout] = useState<NodeJS.Timeout>();

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

    function saveSnapshot(code: string, imageUrl: string) {
        setSnapshots((oldSnapshots) => [{code: code, imageUrl: imageUrl}].concat(oldSnapshots));
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
                        {snapshots.map((snapshot, idx) => <SnapshotView
                            key={idx}
                            snapshot={snapshot}
                            load={(snapshot: Snapshot) => setEditorCode(snapshot.code)}
                        />)}
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
