import MoonScene from './MoonScene';
import SunScene from './SunScene';
import CloudScene from './CloudScene';
import RainScene from './RainScene';
import SnowScene from './SnowScene';
import ThunderstormScene from './ThunderstormScene';
import MistScene from './MistScene';

// Picks the animated SVG scene for a condition; night has its own set
export default function SceneFX({ scene, isNight }) {
  if (isNight) {
    switch (scene) {
      case 'clear':
        return <MoonScene />;
      case 'rain':
      case 'drizzle':
        return <RainScene />;
      case 'snow':
        return <SnowScene />;
      case 'thunderstorm':
        return <ThunderstormScene />;
      case 'mist':
        return <MistScene />;
      default:
        return null; /* stars handled separately */
    }
  }
  switch (scene) {
    case 'clear':
      return <SunScene />;
    case 'clouds':
      return <CloudScene />;
    case 'rain':
    case 'drizzle':
      return <RainScene />;
    case 'snow':
      return <SnowScene />;
    case 'thunderstorm':
      return <ThunderstormScene />;
    case 'mist':
      return <MistScene />;
    default:
      return <CloudScene />;
  }
}
