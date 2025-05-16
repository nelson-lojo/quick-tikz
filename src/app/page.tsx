'use client';
import Preview from "@/components/LivePreview";
import {useEffect, useState} from "react";
// import Image from "next/image";
import AceEditor from "react-ace";
import { useAuth } from "@/contexts/AuthContext";

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
    const { user, signOut } = useAuth();
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
                        {snapshots.slice(0, 6).map((snapshot, idx) => <SnapshotView
                            key={idx}
                            snapshot={snapshot}
                            load={(snapshot: Snapshot) => setEditorCode(snapshot.code)}
                        />)}
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
