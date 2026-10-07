import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import type { ConditionKind } from '@/lib/condition';

// Decorative: the condition is always written out next to the icon
export default function ConditionIcon({
  kind,
  night,
  ...props
}: { kind: ConditionKind; night: boolean } & LucideProps) {
  const Icon = {
    clear: night ? Moon : Sun,
    partly: night ? CloudMoon : CloudSun,
    clouds: Cloud,
    rain: CloudRain,
    storm: CloudLightning,
    snow: CloudSnow,
    mist: CloudFog,
  }[kind];
  return <Icon aria-hidden="true" strokeWidth={1.6} {...props} />;
}
