(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,615022,e=>{"use strict";var t=e.i(843476),a=e.i(363178),s=e.i(271645);function i(){let{setTheme:e,resolvedTheme:i}=(0,a.useTheme)(),[o,l]=(0,s.useState)(!1);(0,s.useEffect)(()=>{let e=window.setTimeout(()=>l(!0),0);return()=>window.clearTimeout(e)},[]);let p=o&&"dark"===i;return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)("style",{dangerouslySetInnerHTML:{__html:`
        @keyframes rgb-flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .rgb-border-wrapper {
          background: linear-gradient(90deg, #ff0000, #ff8c00, #ffe400, #008000, #0000ff, #4b0082, #ee82ee, #ff0000);
          background-size: 300% 300%;
          animation: rgb-flow 6s linear infinite;
        }
        @keyframes planet-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-planet {
          animation: planet-spin 15s linear infinite;
        }
      `}}),(0,t.jsx)("div",{className:"rgb-border-wrapper rounded-full p-[2px] inline-flex shadow-[0_0_12px_rgba(255,255,255,0.2)] dark:shadow-[0_0_12px_rgba(255,255,255,0.1)]",children:(0,t.jsxs)("button",{type:"button",role:"switch","aria-checked":p,"data-testid":"theme-toggle","aria-label":"Tema görünümünü değiştir",onClick:()=>{o&&e(p?"light":"dark")},className:`
            relative inline-flex h-10 w-20 shrink-0 items-center rounded-full 
            transition-colors duration-[800ms] ease-in-out overflow-hidden
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary
            shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]
            ${p?"bg-[#1e293b]":"bg-[#38bdf8]"}
          `,children:[(0,t.jsxs)("div",{className:"absolute inset-0 overflow-hidden rounded-full pointer-events-none",children:[(0,t.jsxs)("div",{className:`
                absolute inset-0 transition-transform duration-[800ms] ease-in-out
                ${p?"translate-y-full opacity-0":"translate-y-0 opacity-100"}
              `,children:[(0,t.jsx)("svg",{className:"absolute bottom-[4px] right-[6px] w-[28px] h-[14px] text-white opacity-95",viewBox:"0 0 24 12",fill:"currentColor",children:(0,t.jsx)("path",{d:"M17.5 12A4.5 4.5 0 0 0 17.5 3c-.22 0-.44.02-.65.06A6.5 6.5 0 0 0 4.5 6.5c0 .32.03.63.08.93A3.5 3.5 0 0 0 4.5 12h13z"})}),(0,t.jsx)("svg",{className:"absolute top-[8px] left-[32px] w-[16px] h-[8px] text-white opacity-80",viewBox:"0 0 24 12",fill:"currentColor",children:(0,t.jsx)("path",{d:"M17.5 12A4.5 4.5 0 0 0 17.5 3c-.22 0-.44.02-.65.06A6.5 6.5 0 0 0 4.5 6.5c0 .32.03.63.08.93A3.5 3.5 0 0 0 4.5 12h13z"})}),(0,t.jsx)("svg",{className:"absolute top-[8px] right-[20px] w-[14px] h-[10px] text-white opacity-70",viewBox:"0 0 24 16",fill:"currentColor",children:(0,t.jsx)("path",{d:"M 2 12 Q 6 4 12 10 Q 18 4 22 12 Q 18 8 12 13 Q 6 8 2 12 Z"})})]}),(0,t.jsxs)("div",{className:`
                absolute inset-0 transition-opacity duration-[800ms] ease-in-out
                ${p?"opacity-100":"opacity-0"}
              `,children:[(0,t.jsx)("div",{className:"absolute top-[10px] left-[12px] h-[2px] w-[2px] rounded-full bg-white shadow-[0_0_3px_1px_rgba(255,255,255,0.7)] animate-[pulse_2s_ease-in-out_infinite]"}),(0,t.jsx)("div",{className:"absolute top-[20px] left-[24px] h-[1px] w-[1px] rounded-full bg-slate-200"}),(0,t.jsx)("div",{className:"absolute top-[26px] left-[14px] h-[2px] w-[2px] rounded-full bg-white shadow-[0_0_3px_1px_rgba(255,255,255,0.8)] animate-[pulse_3s_ease-in-out_infinite]"}),(0,t.jsx)("div",{className:"absolute top-[8px] left-[28px] h-[1.5px] w-[1.5px] rounded-full bg-slate-100"}),(0,t.jsx)("div",{className:"absolute top-[18px] left-[34px] h-[1px] w-[1px] rounded-full bg-white opacity-50"})]})]}),(0,t.jsxs)("div",{className:`
              absolute flex h-[32px] w-[32px] transform items-center justify-center rounded-full 
              transition-all duration-[800ms] ease-[cubic-bezier(0.4,0,0.2,1)] z-10
              shadow-[0_2px_4px_rgba(0,0,0,0.2)]
              ${p?"left-[4px] translate-x-[40px] rotate-[360deg]":"left-[4px] translate-x-0 rotate-0"}
            `,children:[(0,t.jsxs)("div",{className:`
                absolute inset-0 rounded-full transition-opacity duration-[800ms]
                bg-[#fbbf24]
                shadow-[inset_0_-2px_4px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(255,255,255,0.4),0_0_12px_rgba(251,191,36,0.6)]
                ${p?"opacity-0":"opacity-100"}
              `,children:[(0,t.jsx)("svg",{className:"absolute top-[4px] right-[6px] w-[6px] h-[6px] text-white animate-pulse opacity-90",viewBox:"0 0 24 24",fill:"currentColor",children:(0,t.jsx)("path",{d:"M12 0 L13.5 10.5 L24 12 L13.5 13.5 L12 24 L10.5 13.5 L0 12 L10.5 10.5 Z"})}),(0,t.jsx)("svg",{className:"absolute bottom-[6px] left-[6px] w-[4px] h-[4px] text-white/80 animate-[pulse_2s_ease-in-out_infinite]",viewBox:"0 0 24 24",fill:"currentColor",children:(0,t.jsx)("path",{d:"M12 0 L13.5 10.5 L24 12 L13.5 13.5 L12 24 L10.5 13.5 L0 12 L10.5 10.5 Z"})})]}),(0,t.jsx)("div",{className:`
                absolute inset-0 rounded-full transition-opacity duration-[800ms] overflow-hidden
                bg-gradient-to-br from-[#f8fafc] via-[#cbd5e1] to-[#64748b]
                shadow-[inset_-3px_-3px_6px_rgba(0,0,0,0.4),inset_2px_2px_6px_rgba(255,255,255,0.9),0_0_10px_rgba(255,255,255,0.3)]
                ${p?"opacity-100":"opacity-0"}
              `,children:(0,t.jsxs)("div",{className:"absolute inset-0 animate-planet",children:[(0,t.jsx)("div",{className:"absolute top-[4px] right-[4px] h-[10px] w-[10px] rounded-full bg-[#94a3b8] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.6),0_1px_2px_rgba(255,255,255,0.8)]"}),(0,t.jsx)("div",{className:"absolute bottom-[4px] left-[8px] h-[7px] w-[7px] rounded-full bg-[#94a3b8] shadow-[inset_1px_2px_3px_rgba(0,0,0,0.5),0_1px_1px_rgba(255,255,255,0.7)]"}),(0,t.jsx)("div",{className:"absolute top-[14px] left-[4px] h-[4px] w-[4px] rounded-full bg-[#cbd5e1] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.4),0_1px_1px_rgba(255,255,255,0.8)]"}),(0,t.jsx)("div",{className:"absolute top-[14px] right-[10px] h-[3px] w-[3px] rounded-full bg-[#94a3b8] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.4),0_1px_1px_rgba(255,255,255,0.6)]"}),(0,t.jsx)("div",{className:"absolute bottom-[6px] right-[6px] h-[4px] w-[4px] rounded-full bg-[#94a3b8] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.5),0_1px_1px_rgba(255,255,255,0.6)]"})]})})]})]})})]})}e.s(["ModeToggle",()=>i])},135264,e=>{e.n(e.i(615022))}]);