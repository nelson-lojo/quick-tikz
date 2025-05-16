const COLORS = [
  "red",
  "green",
  "blue",
  "yellow",
  "cyan",
  "magenta",
  "black",
  "white",
  "gray",
  "orange",
  "purple",
  "brown",
  "pink",
  "teal",
  "violet",
  "lime",
  "olive",
  "navy",
  "maroon",
  "silver",
  "gold",
];

const VARIABLE_ATTRIBUTES = {
  "line width": ["0.1pt", "0.2pt", "0.4pt", "0.6pt", "0.8pt", "1pt", "1.2pt", "1.6pt", "2pt"],
  _solid: [
    "solid",
    "dashed",
    "dotted",
    "dash dotted",
    "loosely dotted",
    "loosely dashdotted",
    "densely dashed",
    "densely dotted",
    "densely dashdotted",
  ],
  // _lineWidth : [...] // TODO: @chris
  _color: COLORS,
  color: COLORS,
  "inner color": COLORS
};

type ExplorableCmd = keyof(typeof VARIABLE_ATTRIBUTES);
type FigAttributeExplorable = (FigAttribute & { name: ExplorableCmd });

class FigAttribute {
  name: string;
  value: string;
  constructor(name: string, value: string) {
    this.name = name;
    this.value = value;
  }
  debugString(): string {
    return JSON.stringify({ name: this.name, value: this.value });
  }
  toString(): string {
    return this.name.charAt(0) == '_' ? `${this.value}` : `${this.name}=${this.value}`;
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
  const allVariants: string[] = VARIABLE_ATTRIBUTES[attribute.name] ?? [attribute.value]
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
    return `\\${this.command}[${this.attributes.join(", ")}] ${this.body};`;
  }
  debugString(): string {
    return JSON.stringify({
      command: this.command,
      attributes: this.attributes.map((attr) => JSON.parse(attr.toString())),
      body: this.body,
    });
  }
  clone(): FigElement {
    return new FigElement(
      this.command,
      this.attributes.map((a) => a.clone()),
      this.body
    )
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
    return JSON.stringify(
      {
        elements: this.elements.map((elem) => JSON.parse(elem.toString())),
      },
      null,
      2
    );
  }
  toString(): string {
    const envName = this.isRoot ? "tikzpicture" : "scope";
    return `\\begin{${envName}}[${this.attributes.join(", ")}]
${this.elements.join("\n")}
\\end{${envName}}`;
  }
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
    const allAttrs = this.elements.flatMap(el => el.attributes.map(attr => ));
    const dupedElems: (FigElement | Figure)[] = this.elements.flatMap((el) => Array(el.attributes.length).fill([]));
    const attrIndexes = [...Array(allAttrs.length).keys()
      ].filter( idx => allAttrs[idx].isExplorable()
      ).toSorted( () => Math.random() - 0.5
      ).slice(0, attributesToVary);

    type SelAttr = {
      attr: FigAttributeExplorable,
      elem: FigElement | Figure
    };
    const selectedAttrs: SelAttr[] = attrIndexes.map(
      selectedIdx => { return {
        attr: allAttrs[selectedIdx] as FigAttributeExplorable,
        elem: dupedElems[selectedIdx]
      };}
    );

    const transformFig = (sAttr: SelAttr) => (fig: Figure) => {
      //
      return new Figure()
    };
    const figures: Figure[] = [];

    // original figure
    figures.push(new Figure(this.elements, this.attributes, true));
    // variants for each explorable attribute
    this.elements.forEach((elem, cmdIdx) => {
      elem.attributes.forEach((attr, attrIdx) => {
        if (attr.isExplorable()) {
          const variants = genVariants(attr, breadth);
          variants.forEach((variant) => {
            const newCommands = this.elements.map((e) => e.clone());
            // replace only the targeted attribute
            newCommands[cmdIdx].attributes[attrIdx] = variant;
            figures.push(new Figure(newCommands, [], true));
          });
        }
      });
    });
    return figures;
  }

  static combine(figures: Figure[]): Figure {
    return figures.reduce((acc, fig) => acc.compose(fig), new Figure([], [], true));
  }
}

// function parses the tikz code and returns a Figure object
export function parseTikzCode(code: string): Figure {
  const lines = code
    .split("\n")
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

      const attrVariants = Object.entries(VARIABLE_ATTRIBUTES)
        .find(([fieldName, values]) => values.includes(part));
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
