import { useBreakpoints, breakpointsTailwind } from '@vueuse/core'; 

export function useIsMobile() {
    const breakpoints = useBreakpoints(breakpointsTailwind);
    const isMobile = breakpoints.smallerOrEqual('md');

    
    return isMobile;
}