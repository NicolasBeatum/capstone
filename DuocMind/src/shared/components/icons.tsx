import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

const STROKE = 1.8;

/* Caras de emociones estilo ilustración lineal */
interface EmotionFaceProps extends IconProps {
  mood: 'Calmo' | 'Estresado' | 'Alegre' | 'Cansado';
  fill?: string;
}

export function EmotionFace({ mood, size = 30, color = '#1a2b44', fill = '#fff3cf' }: EmotionFaceProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={9.5} fill={fill} stroke={color} strokeWidth={STROKE} />
      {mood === 'Calmo' && (
        <>
          <Path d="M5.5 10 q2 -2 4 0" stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" />
          <Path d="M14.5 10 q2 -2 4 0" stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" />
          <Path d="M9 15 q3 2.5 6 0" stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" />
        </>
      )}
      {mood === 'Estresado' && (
        <>
          <Path d="M5.5 8.5 l3.5 3.5 M9 8.5 l-3.5 3.5" stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" />
          <Path d="M15 8.5 l3.5 3.5 M18.5 8.5 L15 12" stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" />
          <Path d="M8 16.5 q1.5 -2 3 0 q1.5 2 3 0 q1.5 -2 2.5 -0.5" stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" />
        </>
      )}
      {mood === 'Alegre' && (
        <>
          <Circle cx={8.5} cy={10} r={1.1} fill={color} />
          <Circle cx={15.5} cy={10} r={1.1} fill={color} />
          <Path d="M8 14.5 q4 4 8 0" stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" />
        </>
      )}
      {mood === 'Cansado' && (
        <>
          <Path d="M5.5 10 h4 M14.5 10 h4" stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" />
          <Path d="M10 16.5 q2 -1.5 4 0" stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" />
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
