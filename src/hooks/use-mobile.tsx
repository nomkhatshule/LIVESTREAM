import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    // Set the initial value only on the client side
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(mql.matches)
    }
    mql.addEventListener("change", onChange)

    return () => mql.removeEventListener("change", onChange)
  }, []) // Empty dependency array ensures this runs only once on mount

  return !!isMobile
}
