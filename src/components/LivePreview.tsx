import { sendToQuickLaTeX } from "@/lib/quicklatex";
import { useEffect, useState } from "react";
import { Figure, parseTikzCode } from "@/lib/figures";


export default function Preview({code, save}: {
    code: string | undefined,
    save: (code: string, imageUrl: string) => void,
}) {
    const [imgUrl, setImgURL] = useState<string | undefined>("/file.svg");

    const imgTag = imgUrl === undefined ?
        <div>Rendering TikZ...</div> :
        (imgUrl === "/file.svg"
            ? <img src={imgUrl} className="h-3/4 w-3/4 object-contain mx-auto" />
            : <img src={imgUrl} className="max-w-full max-h-full object-contain" />
        );


    useEffect(() => {
        if (code === undefined || code === "") {
            // Keep default image for empty code
        } else {
            // Show loading state
            setImgURL(undefined);

            // Send to QuickLaTeX and update image when done
            sendToQuickLaTeX(code)
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
            className="w-full h-full flex flex-col border-1 overflow-hidden"
        >
            <div className="flex justify-end items-center gap-2 w-full px-2 pt-2">
                <button onClick={() => exportCode(code)}>
                    <img src="/share.png" className="h-5"/>
                </button>
                <button onClick={() => saveWrapper()}>
                    <img src="/screenshot.png" className="h-5"/>
                </button>
            </div>
            <div className="flex-1 min-h-0 flex items-center justify-center w-full overflow-hidden">
                <div className="w-full h-full flex items-center justify-center p-4">
                    {imgTag}
                </div>
            </div>
        </div>;
}
