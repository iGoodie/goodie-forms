import { useId, type ReactNode } from "react";

interface Props {
  label: string;
  render: () => ReactNode;
}

export function SimpleField(props: Props) {
  const id = useId();

  return (
    <div className="flex flex-col gap-2 items-start">
      <label htmlFor={id}>{props.label}</label>
      {props.render()}
    </div>
  );
}
