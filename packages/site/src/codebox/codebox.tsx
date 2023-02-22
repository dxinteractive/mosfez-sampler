import classes from "./codebox.module.css";

export type CodeboxProps = {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
};

export function Codebox(props: CodeboxProps) {
  const { value, onChange, disabled } = props;
  const content = value.split("").map((c, i) => <span key={i}>{c}</span>);
  return (
    <div className={classes.codebox}>
      <div className={classes.inner}>
        <textarea
          className={classes.textarea}
          value={value}
          onChange={onChange}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
          disabled={disabled}
        />
        <pre className={classes.highlight} aria-hidden="true">
          {content}
          <br />
          <br />
        </pre>
      </div>
    </div>
  );
}
