// set of valid tikz colors
const COLORS = ['red', 'green', 'blue', 'yellow', 'cyan', 'magenta', 'black', 'white', 'gray', 'orange', 'purple', 'brown', 'pink', 'teal', 'violet', 'lime', 'olive', 'navy', 'maroon', 'silver', 'gold'];
//set of valid tikz line widths
const LINE_WIDTHS = ['0.1pt', '0.2pt', '0.4pt', '0.6pt', '0.8pt', '1pt', '1.2pt', '1.6pt', '2pt'];
//set of valid tikz line styles
const SOLID = ['solid', 'dashed', 'dotted', 'dash dotted',  'loosely dotted', 'loosely dashdotted', 'densely dashed', 'densely dotted', 'densely dashdotted'];

class FigAttribute {
  name: string;
  value: string;
  constructor(name: string, value: string) {
    this.name = name;
    this.value = value;
  }
  toString(): string {
    return JSON.stringify({ name: this.name, value: this.value });
  }
}

// class that extends FigAttribute to an "explorable" attribute it has an extra field attribute type which could be a color, line width, or line style etc. 
// it inherits the toString method from FigAttribute
class FigAttributeExplorable extends FigAttribute {
    attributeType: string;
    constructor(name: string, value: string, attributeType: string) {
        super(name, value);
        this.attributeType = attributeType;
    }
    genVariants(breadth: number = 3): FigAttributeExplorable[] {
        const variants: FigAttributeExplorable[] = [];
        const allVariants = this.attributeType === 'color'
            ? COLORS
            : this.attributeType === 'line width'
                ? LINE_WIDTHS
                : SOLID;
        const currentValue = this.value;
        // filter out current value
        const candidates = allVariants.filter(v => v !== currentValue);
        // determine how many variants to generate
        const count = Math.min(breadth, candidates.length);
        // randomly select 'count' distinct variants
        for (let i = 0; i < count; i++) {
            const idx = Math.floor(Math.random() * candidates.length);
            const val = candidates.splice(idx, 1)[0];
            variants.push(new FigAttributeExplorable(this.name, val, this.attributeType));
        }
        return variants;
    }

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
    return JSON.stringify({
      command: this.command,
      attributes: this.attributes.map(attr => JSON.parse(attr.toString())),
      body: this.body
    });
  }
}

export class Figure {
  commands: FigElement[];
  constructor(commands: FigElement[]) {
    this.commands = commands;
  }
  toString(): string {
    return JSON.stringify({
      commands: this.commands.map(elem => JSON.parse(elem.toString()))
    }, null, 2);
  }
  toCode(): string {
    return this.commands.map(elem => {
      if (elem.attributes.length > 0) {
        const attrString = elem.attributes
          .map(attr => attr.name == "solid" ? `${attr.value}` : `${attr.name}=${attr.value}`)
          .join(',');
        return `\\${elem.command}[${attrString}] ${elem.body};`;
      } else {
        return `\\${elem.command} ${elem.body};`;
      }
    }).join('\n');
  }
  compose(other: Figure): Figure {
    return new Figure([...this.commands, ...other.commands]);
  }

  decompose(): Figure[] {
    return this.commands.map(cmd => new Figure([cmd]));
  }
  explore(breadth: number = 3): Figure[] {
        const figures: Figure[] = [];
        // helper to deep-clone commands and attributes
        const cloneCommands = (commands: FigElement[]) => 
            commands.map(cmd =>
                new FigElement(
                    cmd.command,
                    cmd.attributes.map(a =>
                        a instanceof FigAttributeExplorable
                            ? new FigAttributeExplorable(a.name, a.value, a.attributeType)
                            : new FigAttribute(a.name, a.value)
                    ),
                    cmd.body
                )
            );
        // original figure
        figures.push(new Figure(cloneCommands(this.commands)));
        // variants for each explorable attribute
        this.commands.forEach((cmd, cmdIdx) => {
            cmd.attributes.forEach((attr, attrIdx) => {
                if (attr instanceof FigAttributeExplorable) {
                    const variants = attr.genVariants(breadth);
                    variants.forEach(variant => {
                        const newCommands = cloneCommands(this.commands);
                        // replace only the targeted attribute
                        newCommands[cmdIdx].attributes[attrIdx] = variant;
                        figures.push(new Figure(newCommands));
                    });
                }
            });
        });
        return figures;
    }

  static combine(figures: Figure[]): Figure {
    return figures.reduce(
      (acc, fig) => acc.compose(fig),
      new Figure([])
    );
    }
}


// function parses the tikz code and returns a Figure object
export function parseTikzCode(code: string): Figure {
  const lines = code.split(';').map(l => l.trim()).filter(l => l.length > 0);
  const commands: FigElement[] = lines.map(line => {
    // Extract command name (e.g., draw, filldraw, shade)
    const cmdMatch = line.match(/^\\(\w+)/);
    const command = cmdMatch ? cmdMatch[1] : '';
    let attributes: FigAttribute[] = [];
    let body = '';
    // Parse attributes inside [ ... ]
    const attrMatch = line.match(/\[([^\]]+)\]/);
    if (attrMatch) {
      const attrString = attrMatch[1];
      const parts = attrString.split(',').map(s => s.trim()).filter(s => s);
      parts.forEach(part => {
        if (part.includes('=')) {
          const [rawName, rawValue] = part.split(/=(.+)/);
          const name = rawName.trim();
          const value = rawValue.trim();
          if (name.toLowerCase().includes('color')) {
            attributes.push(new FigAttributeExplorable(name, value, 'color'));
          } else if (name.toLowerCase().includes('width')) {
            attributes.push(new FigAttributeExplorable(name, value, 'line width'));
          } else if (name.toLowerCase().includes('solid')) {
            attributes.push(new FigAttributeExplorable(name, value, 'solid'));
          } else {
            attributes.push(new FigAttribute(name, value));
          }
        } else if (COLORS.includes(part)) {
          attributes.push(new FigAttributeExplorable('color', part, 'color'));
        } else if (LINE_WIDTHS.includes(part)) {
          attributes.push(new FigAttributeExplorable('line width', part, 'line width'));
        } else if (SOLID.includes(part)) {
          attributes.push(new FigAttributeExplorable('solid', part, 'solid'));
        }
      });
      body = line.slice(line.indexOf(']') + 1).trim();
    } else {
      // No attribute brackets: body is after the command name
      body = line.slice(line.indexOf(command) + command.length + 1).trim();
    }
    return new FigElement(command, attributes, body);
  });
  return new Figure(commands);
}
