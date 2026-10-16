/*
 * Model codes such as "PS-404" or "UT33D+" inside a Persian name: kept on one
 * line (no break after the hyphen) and laid out left-to-right so a trailing
 * "+" stays where it belongs.
 */
const MODEL_CODE = /([A-Za-z0-9]+(?:-[A-Za-z0-9]+)+\+?|[A-Za-z0-9]+\+)/;

export function ProductName({ name }: { name: string }) {
  return name.split(MODEL_CODE).map((part, index) =>
    index % 2 === 1 ? (
      <span key={index} dir="ltr" className="whitespace-nowrap">
        {part}
      </span>
    ) : (
      part
    ),
  );
}
