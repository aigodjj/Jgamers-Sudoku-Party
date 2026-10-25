"use client";

import React from "react";
import { getCosmeticDef } from "@/lib/cosmetics/catalog";
import { useT } from "@/i18n";

export interface AvatarConfig {
  skin?: string;
  hairStyle?: string;
  hairColor?: string;
  face?: string;
  top?: string;
  bottom?: string;
  dress?: string;
  shoes?: string;
  hat?: string;
  glasses?: string;
  accessory?: string;
}

function colorOf(id: string | undefined, fallback: string): string {
  if (!id) return fallback;
  const def = getCosmeticDef(id);
  return def?.colorValue ?? fallback;
}

function renderKeyOf(id: string | undefined): string | undefined {
  if (!id) return undefined;
  return getCosmeticDef(id)?.renderKey;
}

/**
 * A simple layered 2D "paper doll" avatar rendered entirely in SVG so it
 * needs no external image assets. Layer order (back to front): body/skin,
 * bottom, top or dress (dress overrides top+bottom), shoes, hair (back),
 * face, hair (front/fringe), hat, glasses, accessory.
 */
export function AvatarSVG({ config, size = 160 }: { config: AvatarConfig; size?: number }) {
  const t = useT();
  const skinColor = colorOf(config.skin, "#ffe0bd");
  const hairColor = colorOf(config.hairColor, "#2b2b2b");
  const topColor = colorOf(config.top, "#6bbf8e");
  const bottomColor = colorOf(config.bottom, "#4a6fa5");
  const dressColor = colorOf(config.dress, "#f7b2bd");
  const shoesColor = colorOf(config.shoes, "#ffffff");
  const hatColor = colorOf(config.hat, "#e3594d");
  const glassesColor = colorOf(config.glasses, "#333333");
  const accColor = colorOf(config.accessory, "#8a5fd1");

  const hairStyle = renderKeyOf(config.hairStyle) ?? "short";
  const face = renderKeyOf(config.face) ?? "default";
  const hasDress = !!config.dress;
  const hasHat = !!config.hat;
  const hasGlasses = !!config.glasses;
  const hasAccessory = !!config.accessory;

  return (
    <svg viewBox="0 0 200 220" width={size} height={size * 1.1} role="img" aria-label={t("wardrobe.avatarPreview")}>
      {/* accessory: wings behind body */}
      {hasAccessory && renderKeyOf(config.accessory) === "wings" && (
        <g opacity={0.9}>
          <ellipse cx="55" cy="140" rx="22" ry="34" fill={accColor} stroke="#ddd" strokeWidth="2" />
          <ellipse cx="145" cy="140" rx="22" ry="34" fill={accColor} stroke="#ddd" strokeWidth="2" />
        </g>
      )}

      {/* legs/shoes */}
      <rect x="78" y="168" width="18" height="26" rx="6" fill={skinColor} />
      <rect x="104" y="168" width="18" height="26" rx="6" fill={skinColor} />
      <rect x="74" y="188" width="26" height="14" rx="6" fill={shoesColor} stroke="#0002" strokeWidth="1" />
      <rect x="100" y="188" width="26" height="14" rx="6" fill={shoesColor} stroke="#0002" strokeWidth="1" />

      {/* bottom (hidden if dress) */}
      {!hasDress && <rect x="68" y="140" width="64" height="38" rx="14" fill={bottomColor} />}

      {/* body + top OR dress */}
      {hasDress ? (
        <path d="M70 100 Q100 90 130 100 L140 180 Q100 198 60 180 Z" fill={dressColor} />
      ) : (
        <rect x="62" y="100" width="76" height="52" rx="18" fill={topColor} />
      )}

      {/* arms */}
      <circle cx="58" cy="118" r="12" fill={skinColor} />
      <circle cx="142" cy="118" r="12" fill={skinColor} />

      {/* accessory: backpack / balloon in front of body but behind head */}
      {hasAccessory && renderKeyOf(config.accessory) === "backpack" && (
        <rect x="134" y="104" width="22" height="34" rx="8" fill={accColor} />
      )}
      {hasAccessory && renderKeyOf(config.accessory) === "balloon" && (
        <g>
          <line x1="150" y1="110" x2="168" y2="70" stroke="#999" strokeWidth="2" />
          <ellipse cx="170" cy="58" rx="16" ry="20" fill={accColor} />
        </g>
      )}

      {/* hair back layer for ponytail */}
      {hairStyle === "ponytail" && <ellipse cx="146" cy="84" rx="10" ry="22" fill={hairColor} />}

      {/* head */}
      <circle cx="100" cy="72" r="38" fill={skinColor} />

      {/* face */}
      {face === "default" && (
        <>
          <circle cx="86" cy="72" r="4" fill="#333" />
          <circle cx="114" cy="72" r="4" fill="#333" />
          <path d="M90 88 Q100 94 110 88" stroke="#a9584b" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      )}
      {face === "happy" && (
        <>
          <path d="M80 70 Q86 62 92 70" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M108 70 Q114 62 120 70" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M86 86 Q100 100 114 86" stroke="#a9584b" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      )}
      {face === "sparkle" && (
        <>
          <path d="M86 68 L89 75 L96 75 L90 79 L92 87 L86 82 L80 87 L82 79 L76 75 L83 75 Z" fill="#333" />
          <path d="M114 68 L117 75 L124 75 L118 79 L120 87 L114 82 L108 87 L110 79 L104 75 L111 75 Z" fill="#333" />
          <path d="M90 88 Q100 96 110 88" stroke="#a9584b" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      )}
      {face === "cool" && (
        <>
          <rect x="78" y="66" width="16" height="8" rx="3" fill="#333" />
          <rect x="106" y="66" width="16" height="8" rx="3" fill="#333" />
          <path d="M90 90 L110 90" stroke="#a9584b" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      )}

      {/* hair front layers */}
      {hairStyle === "short" && (
        <path d="M60 60 Q60 24 100 24 Q140 24 140 60 Q132 44 100 44 Q68 44 60 60Z" fill={hairColor} />
      )}
      {hairStyle === "bob" && (
        <path d="M58 70 Q50 24 100 22 Q150 24 142 70 Q142 40 100 38 Q58 40 58 70Z" fill={hairColor} />
      )}
      {hairStyle === "ponytail" && (
        <path d="M60 58 Q62 22 100 22 Q138 22 140 58 Q130 40 100 40 Q70 40 60 58Z" fill={hairColor} />
      )}
      {hairStyle === "curly" && (
        <g fill={hairColor}>
          <circle cx="66" cy="44" r="12" />
          <circle cx="82" cy="32" r="13" />
          <circle cx="100" cy="28" r="14" />
          <circle cx="118" cy="32" r="13" />
          <circle cx="134" cy="44" r="12" />
        </g>
      )}
      {hairStyle === "buzz" && (
        <path d="M64 54 Q64 30 100 28 Q136 30 136 54 Q130 42 100 42 Q70 42 64 54Z" fill={hairColor} opacity={0.85} />
      )}

      {/* glasses */}
      {hasGlasses && (
        <g stroke={glassesColor} strokeWidth="3" fill="none">
          <circle cx="86" cy="72" r="11" />
          <circle cx="114" cy="72" r="11" />
          <line x1="97" y1="72" x2="103" y2="72" />
        </g>
      )}

      {/* hat */}
      {hasHat && renderKeyOf(config.hat) === "crown" && (
        <path d="M68 38 L76 18 L88 34 L100 14 L112 34 L124 18 L132 38 Z" fill={hatColor} />
      )}
      {hasHat && renderKeyOf(config.hat) === "cap" && (
        <path d="M58 44 Q100 10 142 44 L146 50 L54 50 Z" fill={hatColor} />
      )}
      {hasHat && renderKeyOf(config.hat) === "beanie" && (
        <path d="M60 46 Q60 14 100 14 Q140 14 140 46 Z" fill={hatColor} />
      )}
      {hasHat && renderKeyOf(config.hat) === "bow" && (
        <g fill={hatColor}>
          <circle cx="78" cy="38" r="10" />
          <circle cx="98" cy="38" r="10" />
          <circle cx="88" cy="38" r="5" fill="#fff8" />
        </g>
      )}
    </svg>
  );
}
