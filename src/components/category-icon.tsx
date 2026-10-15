import {
  BatteryCharging,
  CircuitBoard,
  Component,
  Headphones,
  Laptop,
  Radar,
  Smartphone,
  Watch,
  Wrench,
  type LucideProps,
} from "lucide-react";
import type { IconKey } from "@/lib/types";

const icons = {
  smartphone: Smartphone,
  laptop: Laptop,
  headphones: Headphones,
  watch: Watch,
  battery: BatteryCharging,
  board: CircuitBoard,
  sensor: Radar,
  component: Component,
  tool: Wrench,
} satisfies Record<IconKey, unknown>;

export function CategoryIcon({ icon, ...props }: { icon: IconKey } & LucideProps) {
  const Icon = icons[icon];
  return <Icon aria-hidden {...props} />;
}
