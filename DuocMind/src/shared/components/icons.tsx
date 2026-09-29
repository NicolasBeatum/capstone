import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

const STROKE = 1.8;

/* Caras de emociones estilo ilustración lineal */
interface EmotionFaceProps extends IconProps {
  mood: 'Muy mal' | 'Mal' | 'Neutro' | 'Bien' | 'Muy bien';
  fill?: string;
}

export function EmotionFace({ mood, size = 30, color = '#1a2b44', fill = '#fff3cf' }: EmotionFaceProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={9.5} fill={fill} stroke={color} strokeWidth={STROKE} />
      {mood === 'Muy mal' && (
        <>
          <Path d="M5.5 9.5 L9.5 8" stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" />
          <Path d="M18.5 9.5 L14.5 8" stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" />
          <Circle cx={8} cy={11.5} r={1.1} fill={color} />
          <Circle cx={16} cy={11.5} r={1.1} fill={color} />
          <Path d="M7.5 17.5 q4.5 -3.5 9 0" stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" />
        </>
      )}
      {mood === 'Mal' && (
        <>
          <Path d="M6 10 h3.5 M14.5 10 h3.5" stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" />
          <Path d="M8.5 16.5 q3.5 -2 7 0" stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" />
        </>
      )}
      {mood === 'Neutro' && (
        <>
          <Path d="M6 10 h3.5 M14.5 10 h3.5" stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" />
          <Path d="M8.5 16 h7" stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" />
        </>
      )}
      {mood === 'Bien' && (
        <>
          <Circle cx={8.5} cy={10} r={1.1} fill={color} />
          <Circle cx={15.5} cy={10} r={1.1} fill={color} />
          <Path d="M8.3 14.8 q3.7 2.8 7.4 0" stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" />
        </>
      )}
      {mood === 'Muy bien' && (
        <>
          <Circle cx={8.5} cy={10} r={1.1} fill={color} />
          <Circle cx={15.5} cy={10} r={1.1} fill={color} />
          <Path d="M8 14.5 q4 4 8 0" stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" />
        </>
      )}
    </Svg>
  );
}

export function BellIcon({ size = 20, color = '#1a2b44' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 4.5 a5 5 0 0 1 5 5 c0 3.5 1.2 5 2 5.8 H5 c0.8 -0.8 2 -2.3 2 -5.8 a5 5 0 0 1 5 -5 z"
        stroke={color}
        strokeWidth={STROKE}
        fill="none"
        strokeLinejoin="round"
      />
      <Path d="M10.3 18.3 a1.8 1.8 0 0 0 3.4 0" stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

export function GradCapIcon({ size = 16, color = '#1a2b44' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 5 L2.5 9 L12 13 L21.5 9 z" stroke={color} strokeWidth={STROKE} fill="none" strokeLinejoin="round" />
      <Path d="M6.5 11 v3.5 c0 1.6 11 1.6 11 0 V11" stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" />
      <Path d="M21.5 9 v4.5" stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

export function BoltIcon({ size = 16, color = '#e8a93c' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M13 3 L5.5 13.5 h4.5 L9 21 l7.5 -10.5 h-4.5 z"
        stroke={color}
        strokeWidth={STROKE}
        fill="none"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ClipboardIcon({ size = 52, color = '#1a2b44' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={5.5} y={5} width={13} height={15.5} rx={2} stroke={color} strokeWidth={STROKE} fill="none" />
      <Rect x={9} y={3} width={6} height={4} rx={1.2} stroke={color} strokeWidth={STROKE} fill="#f9e7ae" />
      <Path d="M8.5 11.5 h7 M8.5 15 h7 M8.5 18.5 h4.5" stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

export function LeafIcon({ size = 18, color = '#9aa55c' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M5.5 18.5 C5.5 10.5 11 5.5 19.5 5.5 C19.5 13.5 14 18.5 5.5 18.5 z"
        stroke={color}
        strokeWidth={STROKE}
        fill="none"
        strokeLinejoin="round"
      />
      <Path d="M6.5 17.5 q5.5 -5 10.5 -9.5" stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

export function WindIcon({ size = 22, color = '#1a2b44' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M3.5 9 h9.5 a2.6 2.6 0 1 0 -2.6 -2.6" stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" />
      <Path d="M3.5 13 h13.5 a2.6 2.6 0 1 1 -2.6 2.6" stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" />
      <Path d="M3.5 17 h6" stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

export function SparkleIcon({ size = 12, color = '#d4b43c' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 3 L13.8 10.2 L21 12 L13.8 13.8 L12 21 L10.2 13.8 L3 12 L10.2 10.2 z" fill={color} />
    </Svg>
  );
}

export function PhoneIcon({ size = 20, color = '#1a2b44' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M5.5 4 h3.5 l1 3.8 -2 1.6 a11.5 11.5 0 0 0 6.6 6.6 l1.6 -2 3.8 1 v3.5 a2 2 0 0 1 -2.2 2 A16.5 16.5 0 0 1 3.5 6.2 a2 2 0 0 1 2 -2.2 z"
        stroke={color}
        strokeWidth={STROKE}
        fill="none"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ChatIcon({ size = 20, color = '#1a2b44' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M4 6 a2.5 2.5 0 0 1 2.5 -2.5 h11 A2.5 2.5 0 0 1 20 6 v7 a2.5 2.5 0 0 1 -2.5 2.5 H9.5 L5.5 19 v-3.5 H6.5 A2.5 2.5 0 0 1 4 13 z"
        stroke={color}
        strokeWidth={STROKE}
        fill="none"
        strokeLinejoin="round"
      />
      <Circle cx={8.7} cy={9.8} r={0.9} fill={color} />
      <Circle cx={12} cy={9.8} r={0.9} fill={color} />
      <Circle cx={15.3} cy={9.8} r={0.9} fill={color} />
    </Svg>
  );
}

export function SirenIcon({ size = 20, color = '#1a2b44' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M7 15 v-3 a5 5 0 0 1 10 0 v3" stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" />
      <Path d="M4.5 15 h15 M6.5 18 h11" stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" />
      <Path d="M12 3 v2 M5.5 5.5 l1.4 1.4 M18.5 5.5 l-1.4 1.4" stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

export function HeartIcon({ size = 20, color = '#1a2b44' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 20 C7.5 16.3 4.5 13.4 4.5 9.8 A4.4 4.4 0 0 1 12 7.2 A4.4 4.4 0 0 1 19.5 9.8 C19.5 13.4 16.5 16.3 12 20 z"
        stroke={color}
        strokeWidth={STROKE}
        fill="none"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function HandsHeartIcon({ size = 20, color = '#1a2b44' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M3.5 15.5 q4 3.2 8.5 3.2 t8.5 -3.2" stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" />
      <Path
        d="M12 13.2 c-1.8 -2.2 -4.8 -1.2 -4.8 1 c0 1.9 2.4 3.3 4.8 4.7 c2.4 -1.4 4.8 -2.8 4.8 -4.7 c0 -2.2 -3 -3.2 -4.8 -1 z"
        stroke={color}
        strokeWidth={STROKE}
        fill="none"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SunIcon({ size = 20, color = '#b97a3e' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={4.2} stroke={color} strokeWidth={STROKE} fill="none" />
      <Path
        d="M12 3 v2.2 M12 18.8 V21 M3 12 h2.2 M18.8 12 H21 M5.6 5.6 l1.6 1.6 M16.8 16.8 l1.6 1.6 M18.4 5.6 l-1.6 1.6 M7.2 16.8 l-1.6 1.6"
        stroke={color}
        strokeWidth={STROKE}
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function TimerIcon({ size = 22, color = '#1a2b44' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={13.5} r={7} stroke={color} strokeWidth={STROKE} fill="none" />
      <Path d="M12 13.5 v-3.8 M12 13.5 l2.4 1.7" stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" />
      <Path d="M9.5 3.5 h5 M12 3.5 v2.5" stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

export function MeditationIcon({ size = 22, color = '#1a2b44' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={6.8} r={2.4} stroke={color} strokeWidth={STROKE} fill="none" />
      <Path d="M6.5 17 q5.5 -6.4 11 0" stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" />
      <Path d="M4 20 q8 2.2 16 0" stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

export function MoonIcon({ size = 22, color = '#1a2b44' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M20 13.6 A8 8 0 1 1 10.4 4 A6.4 6.4 0 0 0 20 13.6 z"
        stroke={color}
        strokeWidth={STROKE}
        fill="none"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function LungsIcon({ size = 22, color = '#1a2b44' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 3.5 v5" stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" />
      <Path
        d="M12 8.5 C9.8 7 7.2 7.8 6.6 11 C6 14.5 6 17.4 7.8 18 C9.6 18.6 11 16.8 11 13.5 C11 11.6 11.4 10 12 8.5 z"
        stroke={color}
        strokeWidth={STROKE}
        fill="none"
        strokeLinejoin="round"
      />
      <Path
        d="M12 8.5 C14.2 7 16.8 7.8 17.4 11 C18 14.5 18 17.4 16.2 18 C14.4 18.6 13 16.8 13 13.5 C13 11.6 12.6 10 12 8.5 z"
        stroke={color}
        strokeWidth={STROKE}
        fill="none"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function WaterfallIcon({ size = 22, color = '#1a2b44' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M6 3.5 h12" stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" />
      <Path d="M8.5 3.5 v9 M12 3.5 v13 M15.5 3.5 v9" stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" />
      <Path d="M4.5 20.5 q7.5 2.4 15 0" stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

export function HomeIcon({ size = 20, color = '#1a2b44' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 11 L12 4 L20 11" stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6.5 9.5 V20 h11 V9.5" stroke={color} strokeWidth={STROKE} fill="none" strokeLinejoin="round" />
      <Path d="M10.5 20 v-5 h3 v5" stroke={color} strokeWidth={STROKE} fill="none" strokeLinejoin="round" />
    </Svg>
  );
}

export function SmileIcon({ size = 20, color = '#1a2b44' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={STROKE} fill="none" />
      <Circle cx={8.8} cy={9.8} r={1} fill={color} />
      <Circle cx={15.2} cy={9.8} r={1} fill={color} />
      <Path d="M8 14.2 q4 3 8 0" stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

export function UserIcon({ size = 20, color = '#1a2b44' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={8.2} r={3.6} stroke={color} strokeWidth={STROKE} fill="none" />
      <Path d="M4.5 20.5 q7.5 -5.5 15 0" stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

export function SlidersIcon({ size = 20, color = '#1a2b44' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M3.5 7 h17 M3.5 12 h17 M3.5 17 h17" stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" />
      <Circle cx={15} cy={7} r={1.8} fill={color} />
      <Circle cx={8} cy={12} r={1.8} fill={color} />
      <Circle cx={12.5} cy={17} r={1.8} fill={color} />
    </Svg>
  );
}

export function LogoutIcon({ size = 20, color = '#1a2b44' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M9.5 4 H6 A1.5 1.5 0 0 0 4.5 5.5 v13 A1.5 1.5 0 0 0 6 20 h3.5" stroke={color} strokeWidth={STROKE} fill="none" strokeLinejoin="round" />
      <Path d="M14 8.5 L18 12 L14 15.5" stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9.5 12 H17.5" stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

export function MailIcon({ size = 18, color = '#94a3b8' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={3} y={5.5} width={18} height={13} rx={2.5} stroke={color} strokeWidth={STROKE} fill="none" />
      <Path d="M4 7.5 L12 13 L20 7.5" stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function LockIcon({ size = 18, color = '#94a3b8' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={5.5} y={10.5} width={13} height={9.5} rx={2} stroke={color} strokeWidth={STROKE} fill="none" />
      <Path d="M8.5 10.5 V8 a3.5 3.5 0 0 1 7 0 v2.5" stroke={color} strokeWidth={STROKE} fill="none" />
      <Circle cx={12} cy={15} r={1.2} fill={color} />
    </Svg>
  );
}

export function EyeIcon({ size = 18, color = '#94a3b8' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M2.5 12 q4.5 -6 9.5 -6 t9.5 6 q-4.5 6 -9.5 6 t-9.5 -6 z" stroke={color} strokeWidth={STROKE} fill="none" strokeLinejoin="round" />
      <Circle cx={12} cy={12} r={2.6} stroke={color} strokeWidth={STROKE} fill="none" />
    </Svg>
  );
}

export function EyeOffIcon({ size = 18, color = '#94a3b8' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 4 L20 20" stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" />
      <Path d="M9.8 6.2 A9.4 9.4 0 0 1 12 6 q5 0 9.5 6 a17 17 0 0 1 -3.1 3.4 M6.3 7.7 A16.4 16.4 0 0 0 2.5 12 q4.5 6 9.5 6 a8.6 8.6 0 0 0 3.6 -0.8" stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

export function ShieldIcon({ size = 14, color = '#94a3b8' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 3.5 L19.5 6 v6 c0 4.5 -3.2 7.4 -7.5 8.5 C7.7 19.4 4.5 16.5 4.5 12 V6 z" stroke={color} strokeWidth={STROKE} fill="none" strokeLinejoin="round" />
      <Path d="M9 12 l2.2 2.2 L15.5 9.8" stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
