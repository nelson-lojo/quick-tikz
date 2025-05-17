'use client';
import Preview from "@/components/LivePreview";
import { Figure, parseTikzCode } from "@/lib/figures";
import { sendToQuickLaTeX } from "@/lib/quicklatex";
import {ReactElement, useEffect, useState, useRef, useCallback} from "react";
// import Image from "next/image";
import AceEditor from "react-ace";
import { useAuth } from "@/contexts/AuthContext";
import Modal from "@/components/Modal";
import { exportCode } from "@/lib/export";

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

function SnapshotView({snapshot, load, decompose, explore, include, onContextMenu}: {
    snapshot: Snapshot,
    load: (snapshot: Snapshot) => void,
    decompose: (snapshot: Snapshot) => void,
    explore: (snapshot: Snapshot) => void,
    include: (snapshot: Snapshot) => void,
    onContextMenu: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void,
}) {
    return <div className="w-full h-full border-2 flex items-center justify-center" onClick={() => decompose(snapshot)} onDoubleClick={() => load(snapshot)} onContextMenu={onContextMenu}>
        <div className="w-full h-full p-1">
            {(typeof(snapshot.imageUrl) == "string")
                ? <img src={snapshot.imageUrl} className="w-full h-full object-contain" />
                : <AsyncImg src={snapshot.imageUrl} alt={"Loading ..."} />
            }
        </div>
    </div>;
}

export default function Home() {
    const { user, signOut } = useAuth();
    const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
    const [decomposing, setDecomposing] = useState<number>(-1);
    const [renderedCode, setRenderedCode] = useState('');
    const [editorCode, setEditorCode] = useState('');
    const [renderTimeout, setRenderTimeout] = useState<NodeJS.Timeout>();
    // Popup state
    const [popup, setPopup] = useState<{ idx: number, x: number, y: number } | null>(null);
    const popupRef = useRef<HTMLDivElement>(null);
    const [modalContent, setModalContent] = useState<{ title: string, content: ReactElement } | null>(null);

    // Add effect handler for decomposition
    useEffect(() => {
        if (decomposing >= 0 && decomposing < snapshots.length) {
            decompose(snapshots[decomposing]);
        }
    }, [decomposing, snapshots]);

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

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
                setPopup(null);
            }
        }
        if (popup) {
            document.addEventListener('mousedown', handleClick);
        } else {
            document.removeEventListener('mousedown', handleClick);
        }
        return () => document.removeEventListener('mousedown', handleClick);
    }, [popup]);

    /* TODO: add functionality to transition from dark to light mode */

    function saveSnapshot(code: string, imageUrl: string | Promise<string>) {
        setSnapshots((oldSnapshots) => [{code: code, imageUrl: imageUrl, figure: parseTikzCode(code)}].concat(oldSnapshots));
        setDecomposing(-1);
    }

    function loadCode(code: string) {
        setEditorCode(code);
        setDecomposing(-1);
    }

    function includeCode(snapshot: Snapshot) {
        loadCode(parseTikzCode(editorCode).compose(snapshot.figure, true).toString());
        setModalContent(null);
    }

    const explore = useCallback((snapshot: Snapshot): void => {
        console.log("exploring ...", snapshot.figure, snapshot.figure.explore())
        const subshots: Snapshot[] = snapshot.figure.explore().map((fig) => {
            return {
                code: fig.toString(),
                imageUrl: sendToQuickLaTeX(fig.toString()),
                figure: fig
            }
        });
        const subshotsContainer = <div className="block">
            <div className="grid grid-cols-4 gap-4">
                {subshots.map((subshot, idx) => <SnapshotView
                    key={idx}
                    snapshot={subshot}
                    load={(snapshot: Snapshot) => {
                        setEditorCode(snapshot.code);
                        setModalContent(null);
                    }}
                    decompose={() => {}} // TODO: no-op
                    explore={() => {}} // Disable recursive exploration
                    include={() => includeCode(subshot)}
                    onContextMenu={e => {
                        e.preventDefault();
                        setPopup({ idx, x: e.clientX, y: e.clientY });
                    }}
                />)}
            </div>
        </div>;

        setModalContent({
            title: "Explored Variations",
            content: subshotsContainer
        });
    }, [editorCode, loadCode]);

    const decompose = useCallback((snapshot: Snapshot): void => {
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
                    load={(snapshot: Snapshot) => {
                        setEditorCode(snapshot.code);
                        setModalContent(null);
                    }}
                    decompose={() => {}} // no-op
                    explore={() => explore(subshot)}
                    include={() => includeCode(subshot)}
                    onContextMenu={e => {
                        e.preventDefault();
                        setPopup({ idx, x: e.clientX, y: e.clientY });
                    }}
                />)}
            </div>
        </div>;

        setModalContent({
            title: "Decomposed Components",
            content: subshotsContainer
        });
        setDecomposing(-1); // Reset decomposing state after showing modal
    }, [editorCode, explore, loadCode, setModalContent]);

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
                            <img src="/share.png" className="h-5 invert" />
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
                {/* The Editor + Preview side */}
                <div className="w-2/3 flex flex-col h-full min-h-0 relative overflow-hidden border-r">
                    <div className="flex-1 min-h-0 w-full border-b">
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
                {/* The Snapshots side */}
                <div className="w-1/3 border-1 overflow-hidden flex flex-col h-full">
                    <div className="h-full overflow-y-auto p-2">
                        <div className="grid grid-cols-3 gap-2">
                            {snapshots.map((snapshot, idx) => (
                                <div key={idx} className="aspect-square">
                                    <SnapshotView
                                        snapshot={snapshot}
                                        load={(snapshot: Snapshot) => setEditorCode(snapshot.code)}
                                        decompose={() => {}}
                                        explore={() => {}}
                                        include={() => {}}
                                        onContextMenu={e => {
                                            e.preventDefault();
                                            setPopup({ idx, x: e.clientX, y: e.clientY });
                                        }}
                                    />
                                </div>
                            ))}
                            {/* Popup menu */}
                            {popup && (
                                <div
                                    ref={popupRef}
                                    className="fixed z-50 bg-white border rounded shadow p-2 text-black min-w-[120px]"
                                    style={{ left: popup.x, top: popup.y }}
                                >
                                    <button 
                                        className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                        onClick={() => {
                                            const snapshot = snapshots[popup.idx];
                                            loadCode(snapshot.code);
                                            setPopup(null);
                                        }}
                                    >
                                        Load
                                    </button>
                                    <button 
                                        className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                        onClick={() => {
                                            const snapshot = snapshots[popup.idx];
                                            setDecomposing(popup.idx);
                                            setPopup(null);
                                        }}
                                    >
                                        Decompose
                                    </button>
                                    <button 
                                        className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                        onClick={() => {
                                            const snapshot = snapshots[popup.idx];
                                            explore(snapshot);
                                            setPopup(null);
                                        }}
                                    >
                                        Explore
                                    </button>
                                    <button 
                                        className="block w-full text-left px-2 py-1 hover:bg-gray-200"
                                        onClick={() => {
                                            const snapshot = snapshots[popup.idx];
                                            includeCode(snapshot);
                                        }}
                                    >
                                        Include
                                    </button>
                                </div>
                            )}
                        </div>
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
            
            {/* Add Modal */}
            <Modal
                isOpen={modalContent !== null}
                onClose={() => setModalContent(null)}
                title={modalContent?.title || ""}
            >
                {modalContent?.content}
            </Modal>
        </div>
    );
}
