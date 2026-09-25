import { useEffect, useState } from 'react';

/** Simple 1s tick countdown for OTP resend buttons. */
export function useOtpCountdown() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setTimeout(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(id);
  }, [seconds]);

  return {
    seconds,
    active: seconds > 0,
    start: (n: number) => setSeconds(Math.max(0, Math.round(n))),
    clear: () => setSeconds(0),
  };
}
