import type { MotifName } from "@/lib/explore";
import styles from "./MotifArt.module.css";

/* Line drawings for explorations and experiments that have no image,
   ported from docs/design/v2/reference/. All coordinates are fixed
   integers (nothing is computed), so server and client markup match.
   data-m: l = line, f = dashed line, a = accent stroke, d = filled dot,
   o = open ring. */

const WIDE: Record<MotifName, string> = {
  path: `<path data-m="l" d="M40 132 C110 20 210 20 280 56"/><path data-m="l" d="M40 132 C130 176 230 150 280 56"/><path data-m="f" d="M40 132 Q170 196 280 56"/><path data-m="a" d="M40 132 C120 96 200 70 280 56"/><circle data-m="d" cx="40" cy="132" r="5"/><circle data-m="d" cx="280" cy="56" r="5"/>`,
  orbit: `<path data-m="f" d="M24 156 C80 146 110 124 150 106"/><ellipse data-m="l" cx="162" cy="98" rx="88" ry="52"/><ellipse data-m="f" cx="162" cy="98" rx="58" ry="34"/><ellipse data-m="a" cx="162" cy="98" rx="28" ry="16"/><path data-m="d" d="M153 108 L162 86 L171 108 Z"/>`,
  arm: `<rect data-m="l" x="74" y="150" width="52" height="14" rx="3"/><path data-m="f" d="M30 150 A70 70 0 0 1 170 150"/><path data-m="a" d="M100 150 L150 92 L222 104 L248 72"/><circle data-m="o" cx="100" cy="150" r="7"/><circle data-m="o" cx="150" cy="92" r="6"/><circle data-m="o" cx="222" cy="104" r="6"/>`,
  swarm: `<g data-m="d"><circle cx="60" cy="122" r="3.5"/><circle cx="92" cy="128" r="3.5"/><circle cx="110" cy="100" r="3.5"/><circle cx="140" cy="92" r="3.5"/><circle cx="166" cy="86" r="3.5"/><circle cx="194" cy="80" r="3.5"/><circle cx="220" cy="76" r="3.5"/><circle cx="248" cy="72" r="3.5"/></g><path data-m="a" d="M262 72 L284 58"/><path data-m="f" d="M40 150 C120 130 200 100 300 40"/>`,
  field: `<path data-m="l" d="M112 90 C140 40 180 40 208 90"/><path data-m="l" d="M112 90 C140 4 180 4 208 90"/><path data-m="l" d="M112 90 C140 140 180 140 208 90"/><path data-m="a" d="M121 90 H199"/><circle data-m="d" cx="112" cy="90" r="9"/><circle data-m="o" cx="208" cy="90" r="9"/>`,
  fork: `<path data-m="l" d="M56 92 C120 92 150 46 268 46"/><path data-m="a" d="M56 92 C120 92 150 136 268 136" stroke-dasharray="6 6"/><circle data-m="d" cx="56" cy="92" r="6"/><circle data-m="d" cx="268" cy="46" r="5"/><circle data-m="o" cx="268" cy="136" r="6"/>`,
  spin: `<path data-m="f" d="M16 130 H304"/><path data-m="a" d="M104 100 L216 84"/><ellipse data-m="l" cx="104" cy="100" rx="28" ry="6"/><ellipse data-m="l" cx="216" cy="84" rx="28" ry="6"/><path data-m="l" d="M250 46 A62 62 0 0 1 268 112"/>`,
  level: `<path data-m="f" d="M16 130 H304"/><path data-m="a" d="M104 100 L216 84"/><ellipse data-m="l" cx="104" cy="100" rx="28" ry="6"/><ellipse data-m="l" cx="216" cy="84" rx="28" ry="6"/><rect data-m="d" x="150" y="86" width="20" height="12" rx="3"/>`,
  wave: `<path data-m="l" d="M0 66 Q40 26 80 66 T160 66 T240 66 T320 66"/><path data-m="a" d="M0 92 Q40 52 80 92 T160 92 T240 92 T320 92"/><path data-m="f" d="M0 118 Q40 78 80 118 T160 118 T240 118 T320 118"/>`,
  latch: `<rect data-m="l" x="110" y="50" width="100" height="80" rx="6"/><path data-m="a" d="M130 90 H190"/><path data-m="l" d="M130 50 V26 M190 50 V26 M130 130 V154 M190 130 V154"/>`,
};

const TALL: Record<MotifName, string> = {
  path: `<path data-m="l" d="M0 150 H200"/><path data-m="a" d="M30 40 L110 150 L150 300"/><path data-m="f" d="M110 30 V310"/>`,
  level: `<path data-m="f" d="M10 220 H190"/><path data-m="a" d="M50 170 L150 150"/><ellipse data-m="l" cx="50" cy="170" rx="26" ry="6"/><ellipse data-m="l" cx="150" cy="150" rx="26" ry="6"/>`,
  latch: `<rect data-m="l" x="50" y="120" width="100" height="80" rx="6"/><path data-m="a" d="M70 160 H130"/><path data-m="l" d="M70 120 V96 M130 120 V96 M70 200 V224 M130 200 V224"/>`,
  spin: `<ellipse data-m="l" cx="100" cy="150" rx="60" ry="14"/><path data-m="a" d="M100 60 V150"/><path data-m="f" d="M100 150 L100 230"/>`,
  swarm: `<g data-m="d"><circle cx="50" cy="180" r="3.5"/><circle cx="72" cy="164" r="3.5"/><circle cx="90" cy="186" r="3.5"/><circle cx="108" cy="150" r="3.5"/><circle cx="126" cy="172" r="3.5"/><circle cx="140" cy="140" r="3.5"/></g><path data-m="f" d="M30 230 C90 200 140 160 180 100"/>`,
  orbit: `<ellipse data-m="l" cx="100" cy="165" rx="80" ry="120"/><ellipse data-m="f" cx="100" cy="165" rx="52" ry="78"/><ellipse data-m="a" cx="100" cy="165" rx="24" ry="36"/>`,
  arm: `<rect data-m="l" x="60" y="250" width="80" height="14" rx="3"/><path data-m="a" d="M100 250 L70 170 L130 110 L120 60"/><circle data-m="o" cx="100" cy="250" r="7"/><circle data-m="o" cx="70" cy="170" r="6"/><circle data-m="o" cx="130" cy="110" r="6"/>`,
  field: `<path data-m="l" d="M100 110 C40 140 40 190 100 220"/><path data-m="l" d="M100 110 C160 140 160 190 100 220"/><path data-m="a" d="M100 119 V211"/><circle data-m="d" cx="100" cy="110" r="9"/><circle data-m="o" cx="100" cy="220" r="9"/>`,
  fork: `<path data-m="l" d="M100 300 C100 220 50 180 50 60"/><path data-m="a" d="M100 300 C100 220 150 180 150 60" stroke-dasharray="6 6"/><circle data-m="d" cx="100" cy="300" r="6"/><circle data-m="o" cx="150" cy="60" r="6"/>`,
  wave: `<path data-m="l" d="M0 130 Q25 100 50 130 T100 130 T150 130 T200 130"/><path data-m="a" d="M0 165 Q25 135 50 165 T100 165 T150 165 T200 165"/><path data-m="f" d="M0 200 Q25 170 50 200 T100 200 T150 200 T200 200"/>`,
};

export function MotifArt({ motif, shape = "wide" }: { motif: MotifName; shape?: "wide" | "tall" }) {
  const tall = shape === "tall";
  return (
    <svg
      className={styles.art}
      viewBox={tall ? "0 0 200 330" : "0 0 320 180"}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: (tall ? TALL : WIDE)[motif] }}
    />
  );
}
