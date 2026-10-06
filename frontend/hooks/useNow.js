import { useEffect, useState } from 'react';

// Current time in ms, updated at the start of every minute. Everything that
// depends on "now" (clock, sun arc, day/night) shares this one tick.
export default function useNow() {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let timer;
    const schedule = () => {
      timer = setTimeout(
        () => {
          setNow(Date.now());
          schedule();
        },
        60_000 - (Date.now() % 60_000),
      );
    };
    schedule();
    return () => clearTimeout(timer);
  }, []);

  return now;
}
