/**
 * Human-crafted editorial hero illustration: a job seeker at a laptop with
 * a shield, botanicals and a "safe job" chip. Pure inline SVG so the app
 * never depends on missing external image assets.
 */
export default function HeroIllustration({ className = '' }) {
  return (
    <svg
      viewBox="0 0 720 520"
      className={className}
      role="img"
      aria-label="Illustration of a job seeker working on a laptop, protected by a shield, with plants around them"
    >
      <defs>
        <linearGradient id="hero-blob" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#EEF4E9" />
          <stop offset="100%" stopColor="#DCE9D5" />
        </linearGradient>
        <linearGradient id="hero-lid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#40514A" />
          <stop offset="100%" stopColor="#2C3A35" />
        </linearGradient>
      </defs>

      {/* Background */}
      <circle cx="370" cy="250" r="228" fill="url(#hero-blob)" />
      <circle
        cx="370"
        cy="250"
        r="246"
        fill="none"
        stroke="#C9DDC0"
        strokeWidth="1.6"
        strokeDasharray="2 12"
        strokeLinecap="round"
      />

      {/* Botanicals */}
      <g opacity="0.95">
        <path d="M78 470c30-16 58-40 76-72" stroke="#8FAE86" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        <path d="M104 444c-14-3-24-14-25-29 15 1 27 11 29 25" fill="#C9DDC0" />
        <path d="M128 418c-11-7-17-20-14-34 14 5 23 18 22 32" fill="#A9C79D" />
        <path d="M150 396c-5-14 2-28 15-35 5 15 1 29-10 38" fill="#C9DDC0" />
      </g>
      <g opacity="0.95">
        <path d="M648 468c-30-16-58-40-76-72" stroke="#8FAE86" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        <path d="M622 442c14-3 24-14 25-29-15 1-27 11-29 25" fill="#C9DDC0" />
        <path d="M598 416c11-7 17-20 14-34-14 5-23 18-22 32" fill="#A9C79D" />
        <path d="M576 394c5-14-2-28-15-35-5 15-1 29 10 38" fill="#C9DDC0" />
      </g>

      {/* Ground */}
      <ellipse cx="360" cy="446" rx="232" ry="24" fill="#D8E5D0" />

      {/* Person */}
      <g>
        {/* arms */}
        <path d="M314 274C299 298 300 322 308 337" stroke="#155B46" strokeWidth="22" strokeLinecap="round" fill="none" />
        <path d="M406 274C421 298 420 322 412 337" stroke="#155B46" strokeWidth="22" strokeLinecap="round" fill="none" />
        {/* torso */}
        <path
          d="M306 352v-46c0-30 24-56 54-56s54 26 54 56v46z"
          fill="#155B46"
        />
        {/* collar */}
        <path d="M344 252c5 8 10 12 16 12s11-4 16-12l-8-6h-16z" fill="#0F4635" />
        {/* neck */}
        <rect x="351" y="230" width="18" height="26" rx="8" fill="#EFC3A0" />
        {/* head */}
        <circle cx="360" cy="210" r="36" fill="#F2CDA9" />
        {/* hair */}
        <path
          d="M323 206c0-25 16-44 37-44s37 19 37 44c-3-16-12-26-25-29-11-3-24-1-33 8-7 7-12 13-16 21z"
          fill="#3A2B22"
        />
        <ellipse cx="326" cy="209" rx="7" ry="13" fill="#3A2B22" />
        <ellipse cx="394" cy="209" rx="7" ry="13" fill="#3A2B22" />
        {/* face */}
        <circle cx="349" cy="216" r="3.2" fill="#3A2B22" />
        <circle cx="372" cy="216" r="3.2" fill="#3A2B22" />
        <path d="M352 227c5 6 12 6 17 0" stroke="#3A2B22" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        <ellipse cx="340" cy="224" rx="6" ry="3.4" fill="#EFA98B" opacity="0.6" />
        <ellipse cx="381" cy="224" rx="6" ry="3.4" fill="#EFA98B" opacity="0.6" />
        {/* hands */}
        <circle cx="307" cy="340" r="8.5" fill="#F2CDA9" />
        <circle cx="413" cy="340" r="8.5" fill="#F2CDA9" />
      </g>

      {/* Desk */}
      <rect x="150" y="350" width="420" height="16" rx="8" fill="#C08552" />
      <rect x="176" y="366" width="14" height="76" rx="5" fill="#A9713F" />
      <rect x="530" y="366" width="14" height="76" rx="5" fill="#A9713F" />

      {/* Laptop (viewer sees the lid) */}
      <g>
        <rect x="302" y="286" width="116" height="56" rx="7" fill="url(#hero-lid)" />
        <circle cx="360" cy="314" r="9" fill="#E8F0E4" opacity="0.9" />
        <path
          d="M357 314l2.4 2.4 4.6-5"
          stroke="#155B46"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <rect x="296" y="342" width="128" height="9" rx="4" fill="#2C3A35" />
      </g>

      {/* Plant on the desk */}
      <g transform="translate(468 291) scale(0.42)">
        <path d="M60 96V44" stroke="#6F9A6A" strokeWidth="4" strokeLinecap="round" />
        <path d="M60 62C46 60 34 50 32 34c16 0 29 10 32 24" fill="#B7D3AC" />
        <path d="M60 74c14-4 25-16 26-32-16 2-28 14-30 30" fill="#9BC08F" />
        <path d="M60 50c-9-8-12-22-7-35 12 8 16 22 11 34" fill="#CFE3C6" />
        <path d="M38 96h44l-6 34a6 6 0 0 1-6 5H50a6 6 0 0 1-6-5l-6-34z" fill="#D9A05B" />
        <path d="M34 92h52v8H34z" fill="#C1873F" />
      </g>

      {/* Shield */}
      <g transform="translate(142 124)">
        <circle cx="47" cy="46" r="56" fill="#FFFFFF" opacity="0.75" />
        <g transform="scale(3.4)">
          <path
            d="M12 2.6l7 2.7v6.2c0 4.4-2.9 8.3-7 9.9-4.1-1.6-7-5.5-7-9.9V5.3l7-2.7z"
            fill="#155B46"
            stroke="#104735"
            strokeWidth="1.1"
            strokeLinejoin="round"
          />
          <path
            d="M8.8 12.1l2.2 2.2 4.2-4.6"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>
      </g>

      {/* "Safe job" chip */}
      <g>
        <rect x="96" y="236" width="146" height="46" rx="15" fill="#FFFFFF" stroke="#E5E5D7" />
        <circle cx="122" cy="259" r="8" fill="#16805D" />
        <path d="M118.5 259l2.6 2.6 4.6-5.2" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <text x="140" y="264" fontSize="15" fontWeight="600" fill="#183B32" fontFamily="Inter, system-ui, sans-serif">
          Safe Job
        </text>
      </g>

      {/* Verified badge */}
      <g>
        <circle cx="556" cy="146" r="40" fill="none" stroke="#C9DDC0" strokeWidth="6" />
        <circle cx="556" cy="146" r="29" fill="#16805D" />
        <path
          d="M546 146l7 7 14-15"
          stroke="#FFFFFF"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>

      {/* Editorial wordmark */}
      <text
        x="556"
        y="238"
        textAnchor="middle"
        fontSize="27"
        fontStyle="italic"
        fontWeight="600"
        fill="#155B46"
        fontFamily="Fraunces, Georgia, serif"
      >
        Better Jobs
      </text>
      <text
        x="556"
        y="270"
        textAnchor="middle"
        fontSize="27"
        fontStyle="italic"
        fontWeight="600"
        fill="#68766D"
        fontFamily="Fraunces, Georgia, serif"
      >
        Safer Dreams
      </text>
    </svg>
  );
}
