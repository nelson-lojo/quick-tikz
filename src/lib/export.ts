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
