export type MoodKey =
  | 'excited' | 'confident' | 'nervous' | 'confused'
  | 'anxious' | 'sad' | 'humiliated' | 'isolated'
  | 'gaslit' | 'hopeful' | 'angry' | 'violated'
  | 'empowered' | 'broken' | 'determined';

interface MoodConfig {
  headTilt: number;
  eyeState: 'normal' | 'happy' | 'sad' | 'angry' | 'scared' | 'closed';
  mouthState: 'neutral' | 'smile' | 'frown' | 'open' | 'grimace' | 'teeth';
  bodyLean: number;
  leftArmAngle: number;
  rightArmAngle: number;
  leftArmBend: number;
  rightArmBend: number;
  leftFist: boolean;
  rightFist: boolean;
  color: string;
  shirtDark: string;
  blush: boolean;
  sweat: boolean;
  tears: boolean;
  shake: boolean;
  droop: number;
  armHang: number;
  label: string;
}

const MOOD: Record<MoodKey, MoodConfig> = {
  excited:    { headTilt: -5,  eyeState: 'happy',  mouthState: 'smile',   bodyLean: 5,  leftArmAngle: -20, rightArmAngle: 20,  leftArmBend: 10, rightArmBend: 10, leftFist: false, rightFist: false, color: '#fef9c3', shirtDark: '#fde047', blush: true,  sweat: false, tears: false, shake: false, droop: 0,    armHang: 0,   label: '充满期待' },
  confident:  { headTilt: 0,   eyeState: 'normal', mouthState: 'smile',   bodyLean: 0,  leftArmAngle: -30, rightArmAngle: 30,  leftArmBend: 0,  rightArmBend: 0,  leftFist: false, rightFist: false, color: '#bfdbfe', shirtDark: '#93c5fd', blush: false, sweat: false, tears: false, shake: false, droop: 0,    armHang: 0,   label: '自信满满' },
  nervous:    { headTilt: 6,   eyeState: 'scared', mouthState: 'neutral', bodyLean: -3, leftArmAngle: -60, rightArmAngle: 40,  leftArmBend: 20, rightArmBend: 0,  leftFist: false, rightFist: false, color: '#fed7aa', shirtDark: '#fb923c', blush: false, sweat: true,  tears: false, shake: false, droop: 0,    armHang: 0,   label: '紧张不安' },
  confused:   { headTilt: 12,  eyeState: 'sad',    mouthState: 'neutral', bodyLean: -5, leftArmAngle: -40, rightArmAngle: 40,  leftArmBend: 20, rightArmBend: 20, leftFist: false, rightFist: false, color: '#e5e7eb', shirtDark: '#9ca3af', blush: false, sweat: false, tears: false, shake: false, droop: 0,    armHang: 0,   label: '困惑不解' },
  anxious:    { headTilt: 5,   eyeState: 'scared', mouthState: 'open',    bodyLean: -4, leftArmAngle: -70, rightArmAngle: 70,  leftArmBend: 30, rightArmBend: 30, leftFist: false, rightFist: false, color: '#fde68a', shirtDark: '#f59e0b', blush: false, sweat: true,  tears: false, shake: true,  droop: 0.3,  armHang: 0.3, label: '焦虑不安' },
  sad:        { headTilt: 20,  eyeState: 'sad',    mouthState: 'frown',   bodyLean: -10,leftArmAngle: -60, rightArmAngle: 60,  leftArmBend: 50, rightArmBend: 50, leftFist: false, rightFist: false, color: '#ddd6fe', shirtDark: '#a78bfa', blush: false, sweat: false, tears: true,  shake: false, droop: 0.5,  armHang: 0.5, label: '难过失落' },
  humiliated: { headTilt: 25,  eyeState: 'sad',    mouthState: 'frown',   bodyLean: -15,leftArmAngle: -90, rightArmAngle: 90,  leftArmBend: 70, rightArmBend: 70, leftFist: true,  rightFist: true,  color: '#fce7f3', shirtDark: '#f9a8d4', blush: true,  sweat: false, tears: true,  shake: true,  droop: 0.8,  armHang: 0.7, label: '被羞辱了' },
  isolated:   { headTilt: 18,  eyeState: 'sad',    mouthState: 'neutral', bodyLean: -10,leftArmAngle: -80, rightArmAngle: 80,  leftArmBend: 60, rightArmBend: 60, leftFist: false, rightFist: false, color: '#f3f4f6', shirtDark: '#d1d5db', blush: false, sweat: false, tears: false, shake: false, droop: 0.7,  armHang: 0.6, label: '被孤立' },
  gaslit:     { headTilt: 15,  eyeState: 'sad',    mouthState: 'neutral', bodyLean: -8, leftArmAngle: -70, rightArmAngle: 70,  leftArmBend: 50, rightArmBend: 50, leftFist: false, rightFist: false, color: '#fde68a', shirtDark: '#d97706', blush: false, sweat: false, tears: false, shake: false, droop: 0.6,  armHang: 0.5, label: '自我怀疑' },
  hopeful:   { headTilt: -3,  eyeState: 'happy',  mouthState: 'smile',   bodyLean: 3,  leftArmAngle: -10, rightArmAngle: 10,  leftArmBend: 0,  rightArmBend: 0,  leftFist: false, rightFist: false, color: '#bbf7d0', shirtDark: '#4ade80', blush: true,  sweat: false, tears: false, shake: false, droop: 0,    armHang: 0,   label: '心存希望' },
  angry:     { headTilt: -10, eyeState: 'angry',  mouthState: 'teeth',  bodyLean: 12, leftArmAngle: -95, rightArmAngle: 95,  leftArmBend: 0,  rightArmBend: 0,  leftFist: true,  rightFist: true,  color: '#fecaca', shirtDark: '#ef4444', blush: false, sweat: false, tears: false, shake: true,  droop: 0,    armHang: 0,   label: '愤怒不满' },
  violated:  { headTilt: 12,  eyeState: 'scared', mouthState: 'open',    bodyLean: -8, leftArmAngle: -90, rightArmAngle: 90,  leftArmBend: 40, rightArmBend: 40, leftFist: true,  rightFist: true,  color: '#fee2e2', shirtDark: '#dc2626', blush: false, sweat: true,  tears: false, shake: true,  droop: 0.4,  armHang: 0.4, label: '边界被侵犯' },
  empowered: { headTilt: -10, eyeState: 'happy',  mouthState: 'smile',   bodyLean: 0,  leftArmAngle: -80, rightArmAngle: 80,  leftArmBend: 0,  rightArmBend: 0,  leftFist: false, rightFist: false, color: '#a7f3d0', shirtDark: '#34d399', blush: true,  sweat: false, tears: false, shake: false, droop: 0,    armHang: 0,   label: '充满力量' },
  broken:    { headTilt: 30,  eyeState: 'sad',    mouthState: 'frown',   bodyLean: -18,leftArmAngle: -80, rightArmAngle: 80,  leftArmBend: 80, rightArmBend: 80, leftFist: false, rightFist: false, color: '#d1d5db', shirtDark: '#9ca3af', blush: false, sweat: false, tears: true,  shake: false, droop: 1,    armHang: 0.9, label: '精疲力尽' },
  determined:{ headTilt: -8,  eyeState: 'angry',  mouthState: 'neutral', bodyLean: 8,  leftArmAngle: -90, rightArmAngle: 90,  leftArmBend: 0,  rightArmBend: 0,  leftFist: true,  rightFist: true,  color: '#fef08a', shirtDark: '#f59e0b', blush: false, sweat: false, tears: false, shake: false, droop: 0,    armHang: 0,   label: '下定决心' },
};

// Centered mouth: face center x=50, mouth centered at x=50
// Eyes at x=33 (left) and x=67 (right), so mouth should be around x=50

interface Props {
  mood: MoodKey;
  size?: number;
  showLabel?: boolean;
}

export default function DigitalHuman({ mood, size = 120, showLabel = true }: Props) {
  const cfg = MOOD[mood] || MOOD.confident;

  const shaking = cfg.shake;
  const crying = cfg.tears;

  return (
    <div style={{ width: size, userSelect: 'none', position: 'relative' }}>
      <div style={{ animation: shaking ? 'body-shake 0.25s ease-in-out infinite' : 'none' }}>
        <svg
          viewBox="0 0 100 165"
          width={size}
          height={size * (165 / 100)}
          xmlns="http://www.w3.org/2000/svg"
          style={{ overflow: 'visible' }}
        >
          <ellipse cx={50 + cfg.bodyLean * 0.4} cy="161" rx={28 - cfg.droop * 5} ry={5 - cfg.droop * 2} fill="rgba(0,0,0,0.08)" />

          <g style={{
            transformOrigin: '50px 118px',
            transform: `rotate(${cfg.bodyLean * 0.35}deg)`,
            transition: 'transform 0.6s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            {/* Legs */}
            <rect x="35" y="118" width="12" height="40" rx="6" fill={cfg.color} />
            <rect x="53" y="118" width="12" height="40" rx="6" fill={cfg.color} />
            <ellipse cx="41" cy="157" rx="10" ry="6" fill="#4a3728" />
            <ellipse cx="59" cy="157" rx="10" ry="6" fill="#4a3728" />

            {/* Body */}
            <rect x="28" y="65" width="44" height="56" rx="13" fill={cfg.color} />
            <rect x="28" y="65" width="44" height="56" rx="13" fill={cfg.shirtDark} opacity="0.15" />
            <path d="M40 65 L50 78 L60 65" fill="white" opacity="0.6" />
            <rect x="46" y="68" width="8" height="50" rx="4" fill={cfg.shirtDark} opacity="0.08" />

            {/* LEFT ARM */}
            <g style={{
              transformOrigin: '28px 72px',
              transform: `rotate(${cfg.leftArmAngle + cfg.armHang * 30 + (crying ? 10 : 0)}deg)`,
              transition: 'transform 0.6s cubic-bezier(0.34,1.56,0.64,1)',
            }}>
              <rect x="7" y="66" width="23" height="14" rx="7" fill={cfg.color} />
              <g style={{
                transformOrigin: '18px 80px',
                transform: `rotate(${cfg.leftArmBend + cfg.armHang * 40 + (cfg.leftFist ? -20 : 0)}deg)`,
                transition: 'transform 0.6s cubic-bezier(0.34,1.56,0.64,1)',
              }}>
                <rect x="8" y="78" width="20" height="13" rx="6.5" fill={cfg.color} opacity="0.92" />
                {cfg.leftFist ? (
                  <g>
                    <circle cx="18" cy="93" r="8" fill="#fcd9b8" />
                    <rect x="11" y="86" width="14" height="14" rx="4" fill="#fcd9b8" />
                  </g>
                ) : (
                  <>
                    <circle cx="18" cy="93" r="6.5" fill="#fcd9b8" />
                    {[0,1,2,3].map(i => (
                      <ellipse key={i} cx={12 + i * 2.8} cy={101} rx="2.2" ry="3.5" fill="#fcd9b8" />
                    ))}
                  </>
                )}
              </g>
            </g>

            {/* RIGHT ARM */}
            <g style={{
              transformOrigin: '72px 72px',
              transform: `rotate(${cfg.rightArmAngle - cfg.armHang * 30 - (crying ? 10 : 0)}deg)`,
              transition: 'transform 0.6s cubic-bezier(0.34,1.56,0.64,1)',
            }}>
              <rect x="70" y="66" width="23" height="14" rx="7" fill={cfg.color} />
              <g style={{
                transformOrigin: '82px 80px',
                transform: `rotate(${-cfg.rightArmBend - cfg.armHang * 40 + (cfg.rightFist ? 20 : 0)}deg)`,
                transition: 'transform 0.6s cubic-bezier(0.34,1.56,0.64,1)',
              }}>
                <rect x="72" y="78" width="20" height="13" rx="6.5" fill={cfg.color} opacity="0.92" />
                {cfg.rightFist ? (
                  <g>
                    <circle cx="82" cy="93" r="8" fill="#fcd9b8" />
                    <rect x="75" y="86" width="14" height="14" rx="4" fill="#fcd9b8" />
                  </g>
                ) : (
                  <>
                    <circle cx="82" cy="93" r="6.5" fill="#fcd9b8" />
                    {[0,1,2,3].map(i => (
                      <ellipse key={i} cx={76 + i * 2.8} cy={101} rx="2.2" ry="3.5" fill="#fcd9b8" />
                    ))}
                  </>
                )}
              </g>
            </g>

            {/* Neck */}
            <rect x="43" y="55" width="14" height="14" rx="5" fill="#fcd9b8" />

            {/* HEAD */}
            <g style={{
              transformOrigin: '50px 45px',
              transform: `rotate(${cfg.headTilt + cfg.droop * 20}deg) translateY(${cfg.droop * 8}px)`,
              transition: 'transform 0.7s cubic-bezier(0.34,1.56,0.64,1)',
            }}>
              <circle cx="50" cy="38" r="33" fill="#fcd9b8" />

              {/* Hair */}
              <path d="M17 32 Q17 7 50 7 Q83 7 83 32 Q77 14 50 14 Q23 14 17 32Z" fill="#3d2314" />
              <path d="M17 38 Q13 27 18 19 Q22 28 22 41Z" fill="#3d2314" />
              <path d="M83 38 Q87 27 82 19 Q78 28 78 41Z" fill="#3d2314" />
              {cfg.droop > 0.5 && (
                <path d="M17 32 Q12 45 15 55 Q20 48 22 40Z" fill="#3d2314" opacity="0.7" />
              )}

              {/* Eyebrows */}
              <path
                d={cfg.eyeState === 'angry' ? "M23 29 L37 33" : cfg.eyeState === 'sad' ? "M23 30 Q30 33 37 31" : "M23 31 Q30 28 37 31"}
                stroke="#3d2314" strokeWidth={cfg.eyeState === 'angry' ? '3' : '2.5'} strokeLinecap="round" fill="none"
              />
              <path
                d={cfg.eyeState === 'angry' ? "M63 33 L77 29" : cfg.eyeState === 'sad' ? "M63 31 Q70 33 77 30" : "M63 31 Q70 28 77 31"}
                stroke="#3d2314" strokeWidth={cfg.eyeState === 'angry' ? '3' : '2.5'} strokeLinecap="round" fill="none"
              />

              {/* LEFT EYE */}
              <ellipse cx="33" cy="39" rx="6.5" ry="5.5" fill="white" />
              {cfg.eyeState === 'normal'  && <ellipse cx="33" cy="39.5" rx="4.5" ry="5.5" fill="#1a1a2e" />}
              {cfg.eyeState === 'happy'   && <path d="M29 39 Q33 34 37 39" stroke="#1a1a2e" strokeWidth="2.5" fill="none" strokeLinecap="round" />}
              {cfg.eyeState === 'sad'     && <><ellipse cx="33" cy="40.5" rx="4.5" ry="5" fill="#1a1a2e" /><path d="M28 33 L37 36" stroke="#1a1a2e" strokeWidth="2" strokeLinecap="round" /></>}
              {cfg.eyeState === 'angry'  && <><ellipse cx="33" cy="40.5" rx="4.5" ry="4.5" fill="#1a1a2e" /><path d="M28 33 L37 36" stroke="#1a1a2e" strokeWidth="2.5" strokeLinecap="round" /></>}
              {cfg.eyeState === 'scared' && <><ellipse cx="33" cy="39" rx="7" ry="8" fill="#1a1a2e" /><circle cx="33" cy="37" r="2.5" fill="white" /></>}
              {cfg.eyeState === 'closed'  && <path d="M29 39 Q33 43 37 39" stroke="#1a1a2e" strokeWidth="2.5" fill="none" strokeLinecap="round" />}

              {/* RIGHT EYE */}
              <ellipse cx="67" cy="39" rx="6.5" ry="5.5" fill="white" />
              {cfg.eyeState === 'normal'  && <ellipse cx="67" cy="39.5" rx="4.5" ry="5.5" fill="#1a1a2e" />}
              {cfg.eyeState === 'happy'  && <path d="M63 39 Q67 34 71 39" stroke="#1a1a2e" strokeWidth="2.5" fill="none" strokeLinecap="round" />}
              {cfg.eyeState === 'sad'    && <><ellipse cx="67" cy="40.5" rx="4.5" ry="5" fill="#1a1a2e" /><path d="M63 36 L72 33" stroke="#1a1a2e" strokeWidth="2" strokeLinecap="round" /></>}
              {cfg.eyeState === 'angry'  && <><ellipse cx="67" cy="40.5" rx="4.5" ry="4.5" fill="#1a1a2e" /><path d="M63 36 L72 33" stroke="#1a1a2e" strokeWidth="2.5" strokeLinecap="round" /></>}
              {cfg.eyeState === 'scared' && <><ellipse cx="67" cy="39" rx="7" ry="8" fill="#1a1a2e" /><circle cx="67" cy="37" r="2.5" fill="white" /></>}
              {cfg.eyeState === 'closed'  && <path d="M63 39 Q67 43 71 39" stroke="#1a1a2e" strokeWidth="2.5" fill="none" strokeLinecap="round" />}

              {/* TEARS */}
              {crying && (
                <g>
                  <path d="M26 43 Q24 50 25 60 Q26 68 24 75" stroke="#60a5fa" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.8">
                    <animate attributeName="d" values="M26 43 Q24 50 25 60 Q26 68 24 75;M26 43 Q28 50 27 60 Q26 68 28 75;M26 43 Q24 50 25 60 Q26 68 24 75" dur="1.2s" repeatCount="indefinite" />
                  </path>
                  <circle cx="24" cy="76" r="3.5" fill="#60a5fa" opacity="0.85">
                    <animate attributeName="cy" values="76;100;76" dur="1.4s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.85;0;0.85" dur="1.4s" repeatCount="indefinite" />
                  </circle>
                  <path d="M74 43 Q76 50 75 60 Q74 68 76 75" stroke="#60a5fa" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.8">
                    <animate attributeName="d" values="M74 43 Q76 50 75 60 Q74 68 76 75;M74 43 Q72 50 73 60 Q74 68 72 75;M74 43 Q76 50 75 60 Q74 68 76 75" dur="1.2s" repeatCount="indefinite" begin="0.4s" />
                  </path>
                  <circle cx="76" cy="76" r="3.5" fill="#60a5fa" opacity="0.85">
                    <animate attributeName="cy" values="76;100;76" dur="1.5s" repeatCount="indefinite" begin="0.4s" />
                    <animate attributeName="opacity" values="0.85;0;0.85" dur="1.5s" repeatCount="indefinite" begin="0.4s" />
                  </circle>
                </g>
              )}

              {/* Blush */}
              {cfg.blush && (
                <>
                  <ellipse cx="20" cy="46" rx="8" ry="5" fill="#f87171" opacity="0.35" />
                  <ellipse cx="80" cy="46" rx="8" ry="5" fill="#f87171" opacity="0.35" />
                </>
              )}

              {/* Sweat */}
              {cfg.sweat && (
                <g>
                  <ellipse cx="82" cy="20" rx="3.5" ry="5" fill="#7dd3fc" opacity="0.85">
                    <animate attributeName="cy" values="20;16;20" dur="1.3s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.85;0.3;0.85" dur="1.3s" repeatCount="indefinite" />
                  </ellipse>
                </g>
              )}

              {/* Angry vein */}
              {cfg.eyeState === 'angry' && (
                <path d="M78 18 Q82 12 85 16 Q82 20 78 18Z" fill="#dc2626" opacity="0.7">
                  <animate attributeName="opacity" values="0.7;0.3;0.7" dur="0.6s" repeatCount="indefinite" />
                </path>
              )}

              {/* Nose — small centered */}
              <path d="M48 47 Q50 50 52 47" stroke="#d4a882" strokeWidth="1.5" fill="none" strokeLinecap="round" />

              {/* MOUTH — all centered at x=50 */}
              {cfg.mouthState === 'neutral' && <path d="M43 56 Q50 58 57 56" stroke="#1a1a2e" strokeWidth="2.5" strokeLinecap="round" fill="none" />}
              {cfg.mouthState === 'smile'  && <path d="M42 54 Q50 62 58 54" stroke="#1a1a2e" strokeWidth="2.5" strokeLinecap="round" fill="none" />}
              {cfg.mouthState === 'frown'  && <path d="M42 62 Q50 54 58 62" stroke="#1a1a2e" strokeWidth="2.5" strokeLinecap="round" fill="none" />}
              {cfg.mouthState === 'open'    && <ellipse cx="50" cy="57" rx="7" ry="7" fill="#1a1a2e" />}
              {cfg.mouthState === 'grimace' && <path d="M42 55 Q46 50 50 56 Q54 62 58 55" stroke="#1a1a2e" strokeWidth="2.5" strokeLinecap="round" fill="none" />}
              {cfg.mouthState === 'teeth'   && (
                <>
                  <rect x="42" y="54" width="16" height="9" rx="2.5" fill="white" />
                  <path d="M42 58 Q50 54 58 58" stroke="#1a1a2e" strokeWidth="1.5" fill="none" />
                  <path d="M44 54 L44 63 M47 54 L47 63 M50 54 L50 63 M53 54 L53 63 M56 54 L56 63" stroke="#ddd" strokeWidth="0.5" />
                </>
              )}
            </g>
          </g>
        </svg>
      </div>

      {showLabel && (
        <div className="absolute -bottom-5 left-0 right-0 text-center">
          <span className="text-xs text-gray-500 font-medium">{cfg.label}</span>
        </div>
      )}

      <style>{`
        @keyframes body-shake {
          0%, 100% { transform: translateX(0) rotate(0); }
          20% { transform: translateX(-3px) rotate(-1deg); }
          40% { transform: translateX(3px) rotate(1deg); }
          60% { transform: translateX(-2px) rotate(-0.5deg); }
          80% { transform: translateX(2px) rotate(0.5deg); }
        }
      `}</style>
    </div>
  );
}
