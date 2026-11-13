import { IconBase, type IconProps } from "./Icon";

export function TruckIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M2 6h10v9H2z M12 10h3.5l4 3.5V15H12z M15 10v3.3" />
      <circle cx="6" cy="17" r="1.7" />
      <circle cx="17" cy="17" r="1.7" />
      <path d="M1 9h2 M1 12h1.5" />
    </IconBase>
  );
}
