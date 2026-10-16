import {
  AlarmSmoke,
  BellRing,
  CircuitBoard,
  Component,
  HousePlug,
  PlugZap,
  Radar,
  Refrigerator,
  Wrench,
  type LucideProps,
} from "lucide-react";
import type { IconKey } from "@/lib/types";

const icons = {
  fridge: Refrigerator,
  strip: PlugZap,
  house: HousePlug,
  panel: BellRing,
  smoke: AlarmSmoke,
  board: CircuitBoard,
  sensor: Radar,
  component: Component,
  tool: Wrench,
} satisfies Record<IconKey, unknown>;

export function CategoryIcon({ icon, ...props }: { icon: IconKey } & LucideProps) {
  const Icon = icons[icon];
  return <Icon aria-hidden {...props} />;
}
