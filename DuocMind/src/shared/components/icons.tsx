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
