const indent = (s: string, indentString = '  ') => s.replace(/^/gm, indentString);

const COLORS = [
    "black",
    "blue",
    "brown",
    "cyan",
    "darkgray",
    "gray",
    "green",
    "lightgray",
    "lime",
    "magenta",
    "olive",
    "orange",
    "pink",
    "purple",
    "red",
    "teal",
    "violet",
    "white",
    "yellow"
];

const VARIABLE_ATTRIBUTES = {
    "line width": ["0.1pt", "0.2pt", "0.4pt", "0.6pt", "0.8pt", "1pt", "1.2pt", "1.6pt", "2pt"],
    _lineStyle: [
        "solid",
        "dotted",
        "densely dotted",
        "loosely dotted",
        "dashed",
        "densely dashed",
        "loosely dashed",
        "dashdotted",
        "densely dashdotted",
        "loosely dashdotted",
        "dashdotdotted",
        "densely dashdotdotted",
        "loosely dashdotdotted"
    ],
    _lineWidth: ["ultra thin", "very thin", "thin", "semi thick", "thick", "very thick", "ultra thick"],
    _color: COLORS,
    color: COLORS,
    "inner color": COLORS,
    "outer color": COLORS,
    "top color": COLORS,
    "bottom color": COLORS,
    "left color": COLORS,
    "right color": COLORS,
    "fill": COLORS,
    "draw": COLORS,
};

// type ExplorableCmd = keyof typeof VARIABLE_ATTRIBUTES;
// type FigAttributeExplorable = FigAttribute & { name: ExplorableCmd };

class FigAttribute {
  name: string;
  value: string;
  constructor(name: string, value: string) {
    this.name = name;
    this.value = value;
  }
  debugString(): string {
    return `{name: ${this.name}, value: ${this.value}}`;
  }
  toString(): string {
    return this.name.charAt(0) == "_" ? `${this.value}` : `${this.name}=${this.value}`;
  }
  clone(): FigAttribute {
    return new FigAttribute(this.name, this.value);
  }
  isExplorable(): boolean {
    return Object.hasOwn(VARIABLE_ATTRIBUTES, this.name);
  }
}

// class that extends FigAttribute to an "explorable" attribute it has an extra field attribute type which could be a color, line width, or line style etc.
// it inherits the toString method from FigAttribute
function genVariants(attribute: FigAttribute, breadth: number = 3): FigAttribute[] {
  const variants: FigAttribute[] = [];
  // @ts-expect-error
  const allVariants: string[] = VARIABLE_ATTRIBUTES[attribute.name] ?? [attribute.value];
  // filter out current value
  const candidates = allVariants.filter((v) => v !== attribute.value);
  // determine how many variants to generate
  const count = Math.min(breadth, candidates.length);
  // randomly select 'count' distinct variants
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * candidates.length);
    const val = candidates.splice(idx, 1)[0];
    variants.push(new FigAttribute(attribute.name, val));
  }
  return variants;
}

class FigElement {
  command: string;
  attributes: FigAttribute[];
  body: string;
  constructor(command: string, attributes: FigAttribute[], body: string) {
    this.command = command;
    this.attributes = attributes;
    this.body = body;
  }
  toString(): string {
    if (this.attributes.length === 0) {
      return `\\${this.command} ${this.body};`;
    }
    return `\\${this.command}[${this.attributes.join(", ")}] ${this.body};`;
  }
  debugString(): string {
    return `{command: ${this.command}, attributes: [${this.attributes.map(attr => attr.debugString()).join(", ")}], body: ${this.body}}`;
  }
  clone(): FigElement {
    return new FigElement(
      this.command,
      this.attributes.map((a) => a.clone()),
      this.body
    );
  }
}

export class Figure {
    elements: (FigElement | Figure)[];
    attributes: FigAttribute[];
    isRoot: boolean;

    constructor(elements: (FigElement | Figure)[], attributes: FigAttribute[], isRoot: boolean) {
        this.elements = elements;
        this.attributes = attributes;
        this.isRoot = isRoot;
    }

    debugString(): string {
        return `{elements: [${this.elements.map(elem => 
      elem instanceof Figure ? elem.debugString() : elem.debugString()
    ).join(", ")}], attributes: [${this.attributes.map(attr => attr.debugString()).join(", ")}], isRoot: ${this.isRoot}}`;
    }

    

  toString(): string {
    const attributeStr = this.attributes.length > 0 ? `[${this.attributes.join(", ")}]` : "";
    if (this.isRoot) {
      return this.elements.join("\n");
    }
    return `\\begin{scope}${attributeStr}\n${indent(this.elements.join("\n"))}\n\\end{scope}`;
  }




      //   if (this.isRoot) {
  //     return `${elementsStr}`;
  //   }
  //   return `${indent}\\begin{scope}${attributeStr}\n${elementsStr}\n${indent}\\end{scope}`;

  // toString(): string {
  //   if (this.elements.length === 0) {
  //     return "";
  //   }
  //   return this._toStringWithIndent(0);
  // }


  // _toStringWithIndent(indentLevel: number): string {
  //   const indent = "\t".repeat(indentLevel);
  //   const childIndent = "\t".repeat(indentLevel + 1);

  //   // const envName = this.isRoot ? "tikzpicture" : "scope";
  //   const attributeStr = this.attributes.length > 0 ? `[${this.attributes.join(", ")}]` : "";

  //   const elementsStr = this.elements.map(el => {
  //     if (el instanceof Figure) {
  //       return el._toStringWithIndent(indentLevel + 1);
  //     } else {
  //       return `${childIndent}${el.toString()}`;
  //     }
  //   }).join("\n");
  //   // dont add the tikzpicture environment if isRoot is true
  //   if (this.isRoot) {
  //     return `${elementsStr}`;
  //   }
  //   return `${indent}\\begin{scope}${attributeStr}\n${elementsStr}\n${indent}\\end{scope}`;
  // }

      // add the tikzpicture environment if isRoot is false
// //toString(): string {
//     if (this.isRoot) return this.elements.join("\n");

//     return `\\begin{scope}[${this.attributes.join(", ")}]
// ${this.elements.join("\n")}
// \\end{scope}`;
//   }
  

  // toEditorCode is like toString but without the tikzpicture environment if isRoot is true
  // toEditorCode(): string {
  //   if (this.elements.length === 0) {
  //     return "";
  //   }
  //   if (this.isRoot) {
  //     return this.elements
  //       .map((el) => {
  //         if (el instanceof Figure) {
  //           return el._toEditorCodeWithIndent(0);
  //         } else {
  //           return el.toString();
  //         }
  //       }
  //       )
  //       .join("\n");
  //   }
  //   return this._toStringWithIndent(0);
  // }
  // _toEditorCodeWithIndent(indentLevel: number): string {
  //   const indent = "\t".repeat(indentLevel);
  //   const childIndent = "\t".repeat(indentLevel + 1);
  //   const attributeStr = this.attributes.length > 0 ? `[${this.attributes.join(", ")}]` : "";
  //   const elementsStr = this.elements.map((el) => {
  //     if (el instanceof Figure) {
  //       return el._toEditorCodeWithIndent(indentLevel + 1);
  //     } else {
  //       return `${childIndent}${el.toString()}`;
  //     }
  //   }
  //   ).join("\n");
  //   return `${indent}\\begin{scope}${attributeStr}\n${elementsStr}\n${indent}\\end{scope}`;
  // }
  
  clone(): Figure {
    return new Figure(
      this.elements.map((e) => e.clone()),
      this.attributes.map((a) => a.clone()),
      this.isRoot
    );
  }
  compose(other: Figure, heirarchical?: boolean): Figure {
    if (heirarchical) {
      other = new Figure(other.elements, other.attributes, false);
      if (other.elements.length == 1) {
        return new Figure([...this.elements, ...other.elements], [], true);
      }
      return new Figure([...this.elements, other], [], true);
    }

        return new Figure(
            [...this.elements, ...other.elements],
            [...this.attributes, ...other.attributes],
            true
        );
    }

    decompose(): Figure[] {
        return this.elements.map(
            (el) =>
                el instanceof Figure
                    ? new Figure(el.elements, el.attributes, true)
                    : new Figure([el], [], true)
        );
    }

  explore(breadth: number = 3, attributesToVary: number = 2): Figure[] {
    const allVariations = this.elements.flatMap((el, elIndex) =>
      el.attributes
        .filter((attr) => attr.isExplorable())
        .map((attr, attrIndex) => {
          const variants = genVariants(attr, breadth);
          return (fig: Figure): Figure[] =>
            [fig].concat(
              variants.map((variant) => {
                const f = fig.clone();
                // replace only the targeted attribute
                f.elements[elIndex].attributes[attrIndex] = variant;
                return f;
              })
            );
        })
    );

    const selectedVariations = [];
    for (let idx = 0; idx < attributesToVary; idx++) {
      selectedVariations.push(
        allVariations.splice(Math.floor(Math.random() * allVariations.length), 1)[0]
      );
    }

    const figures = selectedVariations.reduce(
      (prevFigs, currVariation) => prevFigs.flatMap((f) => currVariation(f)),
      [this.clone()]
    );

    return figures;
  }

    static combine(figures: Figure[]): Figure {
        return figures.reduce((acc, fig) => acc.compose(fig), new Figure([], [], true));
    }
}

// function parses the tikz code and returns a Figure object
export function parseTikzCode(code: string): Figure {
    const lines = code
        .split(";") // should be ; ?
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

  let figChain = [new Figure([], [], true)];
  let tmpFig: Figure;
  lines.forEach((line) => {
    const attrMatch = line.match(/\[([^\]]+)\]/);
    let attrParts: string[] = [];
    let bodyString = ""; // ignored when entering/exiting a scope
    const cmdMatch = line.match(/^\\(\w+)/);
    const command = cmdMatch ? cmdMatch[1] : "";
    if (attrMatch) {
      attrParts = attrMatch[1]
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s);
      bodyString = line.slice(line.indexOf("]") + 1).trim();
    } else {
      // No attribute brackets: body is after the command name
      bodyString = line.slice(line.indexOf(command) + command.length + 1).trim();
    }
    const body = bodyString;

        const attributes: FigAttribute[] = attrParts.map((part) => {
            if (part.includes("=")) {
                const [rawName, rawValue] = part.split(/=(.+)/);
                const name = rawName.trim();
                const value = rawValue.trim();
                return new FigAttribute(name, value);
            }

            part = part.trim();

      const attrVariants = Object.entries(VARIABLE_ATTRIBUTES).find(([fieldName, values]) =>
        values.includes(part)
      );
      if (attrVariants === undefined) return new FigAttribute("", part);

            const name: string = attrVariants[0];
            return new FigAttribute(name, part);
        });

    if (line.includes("\\begin{scope}")) {
      tmpFig = new Figure([], attributes, false);
      figChain.at(-1)?.elements.push(tmpFig); //TODO
      figChain.push(tmpFig);
    } else if (line.includes("\\end{scope}")) {
      figChain.pop();
      if (figChain.length < 1) {
        throw Error("Ran out of figure parents!!!");
      }
    } else {
      figChain.at(-1)?.elements.push(new FigElement(command, attributes, body));
    }
  });

    if (figChain.length !== 1) {
        throw Error("Figure inheritance not completed!");
    }
    return figChain[0];
}
