import React from "react";
import "./LegoAvatar.css";

/**
 * Nandini as a brick minifigure, in her Builder-poster look: long dark
 * centre-parted hair, maroon "Iconic Nothing" tee, silver cross, denim.
 *
 * Pure SVG so it stays crisp at any size. It idles (blinks, breathes, hair
 * sways) on its own, and strides whenever any ancestor has `.is-walking`.
 */
export default function LegoAvatar({ className = "" }) {
  return (
    <svg className={"lego " + className} viewBox="0 0 120 190" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="lego-skin" x1="0" x2="1">
          <stop offset="0" stopColor="#b9774f" />
          <stop offset="0.38" stopColor="#dca37b" />
          <stop offset="0.55" stopColor="#efc29c" />
          <stop offset="1" stopColor="#b9774f" />
        </linearGradient>
        <linearGradient id="lego-tee" x1="0" x2="1">
          <stop offset="0" stopColor="#4c1320" />
          <stop offset="0.45" stopColor="#7c2434" />
          <stop offset="0.6" stopColor="#8a2c3c" />
          <stop offset="1" stopColor="#4c1320" />
        </linearGradient>
        <linearGradient id="lego-denim" x1="0" x2="1">
          <stop offset="0" stopColor="#1f2a52" />
          <stop offset="0.5" stopColor="#34477e" />
          <stop offset="1" stopColor="#1f2a52" />
        </linearGradient>
        <linearGradient id="lego-hair" x1="0" x2="1">
          <stop offset="0" stopColor="#0d0a12" />
          <stop offset="0.5" stopColor="#2a2030" />
          <stop offset="1" stopColor="#0d0a12" />
        </linearGradient>
      </defs>

      <g className="lego-fig">
        <ellipse className="lego-shadow" cx="60" cy="186" rx="30" ry="3.5" />

        {/* legs swing from the hip */}
        <g className="lego-leg lego-leg-l">
          <path d="M33,126 H59 V170 H33 Z" fill="url(#lego-denim)" />
          <path d="M32,168 H60 V180 Q60,182 58,182 H34 Q32,182 32,180 Z" fill="#1b2446" />
        </g>
        <g className="lego-leg lego-leg-r">
          <path d="M61,126 H87 V170 H61 Z" fill="url(#lego-denim)" />
          <path d="M60,168 H88 V180 Q88,182 86,182 H62 Q60,182 60,180 Z" fill="#1b2446" />
        </g>

        <g className="lego-body">
          {/* long hair behind her back */}
          <path
            className="lego-hair-back"
            d="M38,30 C29,52 29,82 31,110 Q36,116 42,110 Q48,116 54,110 L66,110 Q72,116 78,110 Q84,116 89,110 C91,82 91,52 82,30 Z"
            fill="url(#lego-hair)"
          />
          <path d="M32,117 H88 V128 H32 Z" fill="url(#lego-denim)" />
          <path d="M41,66 H79 L88,118 H32 Z" fill="url(#lego-tee)" />
          {/* silver cross on a chain */}
          <path className="lego-chain" d="M49,67 Q60,82 71,67" />
          <path className="lego-cross" d="M60,76.5 V86 M57,79.2 H63" />
          {/* the tee print */}
          <text className="lego-print" x="60" y="98" textAnchor="middle" transform="rotate(-6 60 100)">
            Iconic
          </text>
          <text className="lego-print" x="61" y="108" textAnchor="middle" transform="rotate(-6 60 100)">
            Nothing
          </text>
          <path d="M53,61 H67 V67 H53 Z" fill="url(#lego-skin)" />

          {/* arms: short tee sleeve, then skin, then the C-hand */}
          <g className="lego-arm lego-arm-l">
            <path d="M41,67 L50,72 L46,86 L35,83 Z" fill="url(#lego-tee)" />
            <path d="M35,83 L46,86 L40,106 L29,103 Z" fill="url(#lego-skin)" />
            <circle cx="33.5" cy="110" r="6.2" fill="url(#lego-skin)" />
            <circle className="lego-hand-hole" cx="33.5" cy="111" r="2.6" />
          </g>
          <g className="lego-arm lego-arm-r">
            <path d="M79,67 L70,72 L74,86 L85,83 Z" fill="url(#lego-tee)" />
            <path d="M85,83 L74,86 L80,106 L91,103 Z" fill="url(#lego-skin)" />
            <circle cx="86.5" cy="110" r="6.2" fill="url(#lego-skin)" />
            <circle className="lego-hand-hole" cx="86.5" cy="111" r="2.6" />
          </g>

          {/* head */}
          <g className="lego-head">
            <rect x="40" y="22" width="40" height="41" rx="9" fill="url(#lego-skin)" />
            <g className="lego-face">
              <path className="lego-brow" d="M47.5,36 Q51.5,33.6 56,35.4" />
              <path className="lego-brow" d="M64,35.4 Q68.5,33.6 72.5,36" />
              <g className="lego-eyes">
                <ellipse cx="52" cy="42.5" rx="2.6" ry="3.3" fill="#140c18" />
                <ellipse cx="68" cy="42.5" rx="2.6" ry="3.3" fill="#140c18" />
                <circle cx="53" cy="41.3" r="0.95" fill="#fff" />
                <circle cx="69" cy="41.3" r="0.95" fill="#fff" />
              </g>
              <path className="lego-lash" d="M49.2,40.8 L47.6,39.4 M70.8,40.8 L72.4,39.4" />
              <circle cx="46.5" cy="49" r="3.2" fill="#ff8a8a" opacity="0.32" />
              <circle cx="73.5" cy="49" r="3.2" fill="#ff8a8a" opacity="0.32" />
              <path d="M53.5,50.5 Q60,57 66.5,50.5 Q60,53.4 53.5,50.5 Z" fill="#9b3346" />
            </g>
            {/* centre-parted hair cap */}
            <path
              d="M37,47 C34,20 45,4 60,4 C75,4 86,20 83,47 C80,37 79,29 74,24 C69,19.5 64,18.5 60,19.5 C56,18.5 51,19.5 46,24 C41,29 40,37 37,47 Z"
              fill="url(#lego-hair)"
            />
            <path className="lego-part" d="M60,6 V19" />
          </g>

          {/* the locks that fall over her shoulders */}
          <path
            className="lego-lock lego-lock-l"
            d="M37,40 C32,58 33,82 35,102 C37,108 44,108 45,101 C44,86 43,66 44,47 C43,41 40,37 37,40 Z"
            fill="url(#lego-hair)"
          />
          <path
            className="lego-lock lego-lock-r"
            d="M83,40 C88,58 87,82 85,102 C83,108 76,108 75,101 C76,86 77,66 76,47 C77,41 80,37 83,40 Z"
            fill="url(#lego-hair)"
          />
        </g>
      </g>
    </svg>
  );
}
