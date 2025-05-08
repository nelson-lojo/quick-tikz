// quicklatex.ts
// This module provides a function to send LaTeX code to the QuickLaTeX API
// and retrieve the generated image URL. It uses the Fetch API to make a POST request
// to the QuickLaTeX service with the LaTeX code and some additional parameters.
// The function is asynchronous and returns a Promise that resolves to the image URL.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
/*this function sends text to the quicklatex api and returns the image url*/
function sendToQuickLaTeX(tex) {
    return __awaiter(this, void 0, void 0, function () {
        var response, raw, data, parts;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch('https://quicklatex.com/latex3.f', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        body: new URLSearchParams({
                            formula: tex,
                            fsize: '17px',
                            fcolor: '000000',
                            mode: '0',
                            out: '1',
                            remhost: 'quicklatex.com',
                            preamble: "\\usepackage{amsmath}\n      \\usepackage{amssymb}\n      \\usepackage{amsfonts}",
                        }),
                    })];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error('Failed to generate LaTeX image');
                    }
                    return [4 /*yield*/, response.text()];
                case 2:
                    raw = _a.sent();
                    data = raw.trim();
                    parts = data.split(/\s+/);
                    if (parts[0] === '0') {
                        // standard: [status, url, ...]
                        return [2 /*return*/, parts[1]];
                    }
                    else if (parts[1] === '0') {
                        // alternate: [url, status, ...]
                        return [2 /*return*/, parts[0]];
                    }
                    throw new Error('QuickLaTeX error: ' + data);
            }
        });
    });
}
var teststr = '$\\sum\\limits_i^\\infty$';
sendToQuickLaTeX(teststr)
    .then(function (url) { return console.log('Image URL:', url); })
    .catch(function (err) { return console.error(err); });
