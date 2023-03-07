import { useCallback, useMemo } from "react";
import clsx from "clsx";
import classes from "./codebox.module.css";

export function setCharAtPos(text: string, x: number, y: number, char: string) {
  const lines = text.split("\n");
  const line = lines[y].split("");
  line[x] = char;
  lines[y] = line.join("");
  return lines.join("\n");
}

function toNumber(str?: string) {
  return str === undefined ? undefined : Number(str);
}

function useHighlightedChars(
  text: string,
  highlight: string,
  padX: number | undefined,
  padY: number | undefined
) {
  return useMemo(() => {
    const elems: React.ReactNode[] = [];
    const highlights = highlight.split("");
    const lines = text.split("\n");
    const ymax = Math.max(lines.length, padY ?? 0);
    let charsSoFar = 0;
    for (let y = 0; y < ymax; y++) {
      const line = lines[y];
      const lineLength = line?.length ?? 0;
      const xmax = Math.max(lineLength, padX ?? 0);
      for (let x = 0; x < xmax; x++) {
        const charIndex = charsSoFar + x;
        const char = line?.[x];
        const h = char ? highlights[charIndex] : undefined;
        const c = char ? charIndex : undefined;
        const className = h ? `highlight-${h || ""}` : "";
        elems.push(
          <span
            key={`${x}.${y}`}
            data-x={x}
            data-y={y}
            data-c={c}
            className={className}
          >
            {char ?? " "}
          </span>
        );
      }
      charsSoFar += lineLength;
      elems.push(<br key={`br.${y}`} />);
    }
    elems.push(<br key="br.end" />);
    elems.push(<br key="br.end2" />);
    return elems;
  }, [text, highlight]);
}

export type CellClickParams = {
  char: string;
  charIndex?: number;
  x?: number;
  y?: number;
};

export type CodeboxInputMode = "type" | "touch";

export type CodeboxProps = {
  value: string;
  highlight?: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onCellClick: (params: CellClickParams) => void;
  className?: string;
  padX?: number;
  padY?: number;
  inputMode?: CodeboxInputMode;
};

export function Codebox(props: CodeboxProps) {
  const {
    value,
    onChange,
    highlight = "",
    className,
    padX,
    padY,
    inputMode = "type",
    onCellClick,
  } = props;
  const highlightedChars = useHighlightedChars(value, highlight, padX, padY);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLPreElement>) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const elem = e.target as any as HTMLElement;
      const { x, y, c } = elem.dataset;
      if (x === undefined) return;

      onCellClick?.({
        char: elem.innerHTML,
        charIndex: toNumber(c),
        x: toNumber(x),
        y: toNumber(y),
      });
    },
    [onCellClick]
  );

  const highlightClassName = clsx(
    classes.highlight,
    inputMode === "type" && classes.highlightType,
    inputMode === "touch" && classes.highlightTouch
  );

  return (
    <div className={clsx(classes.codebox, className)}>
      <div className={classes.inner}>
        <textarea
          className={classes.textarea}
          value={value}
          onChange={onChange}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
        />
        <pre
          className={highlightClassName}
          aria-hidden="true"
          onClick={handleClick}
        >
          {highlightedChars}
        </pre>
      </div>
    </div>
  );
}
