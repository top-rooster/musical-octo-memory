interface AttributeLine { number: number; text: string; }

export function parseAttributeDescriptions(source: string): Record<string, string> {
  const result: Record<string, string> = {};
  let block: AttributeLine[] = [];
  const flush = () => {
    if (!block.length) return;
    if (block.length < 2) {
      throw new Error(`attributes.txt line ${block[0].number}: missing description for "${block[0].text}"`);
    }
    const [name, ...description] = block;
    if (result[name.text]) {
      throw new Error(`attributes.txt line ${name.number}: duplicate attribute "${name.text}"`);
    }
    result[name.text] = description.map((line) => line.text).join(" ");
    block = [];
  };
  source.split(/\r?\n/).forEach((raw, index) => {
    const text = raw.trim();
    if (text.startsWith("#")) return;
    if (!text) flush();
    else block.push({ number: index + 1, text });
  });
  flush();
  return result;
}
