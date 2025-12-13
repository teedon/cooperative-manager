import React from 'react';
import Svg, { Circle, Path, G, Rect, Defs, LinearGradient, Stop, Ellipse } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
}

/**
 * Community illustration - Shows people coming together
 */
export const CommunityIllustration: React.FC<IllustrationProps> = ({ 
  width = 280, 
  height = 280 
}) => (
  <Svg width={width} height={height} viewBox="0 0 280 280">
    <Defs>
      <LinearGradient id="bg1" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#eef2ff" />
        <Stop offset="100%" stopColor="#c7d2fe" />
      </LinearGradient>
      <LinearGradient id="person1" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#6366f1" />
        <Stop offset="100%" stopColor="#4f46e5" />
      </LinearGradient>
      <LinearGradient id="person2" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#06b6d4" />
        <Stop offset="100%" stopColor="#0891b2" />
      </LinearGradient>
      <LinearGradient id="person3" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#f59e0b" />
        <Stop offset="100%" stopColor="#d97706" />
      </LinearGradient>
    </Defs>
    
    {/* Background circle */}
    <Circle cx="140" cy="140" r="130" fill="url(#bg1)" opacity="0.5" />
    
    {/* Ground shadow */}
    <Ellipse cx="140" cy="240" rx="100" ry="15" fill="#4f46e5" opacity="0.1" />
    
    {/* Center person (main) */}
    <G>
      <Circle cx="140" cy="100" r="28" fill="url(#person1)" />
      <Path
        d="M140 135 C110 135 85 160 85 195 L85 210 C85 215 89 220 95 220 L185 220 C191 220 195 215 195 210 L195 195 C195 160 170 135 140 135 Z"
        fill="url(#person1)"
      />
    </G>
    
    {/* Left person */}
    <G transform="translate(-55, 30)">
      <Circle cx="140" cy="110" r="22" fill="url(#person2)" />
      <Path
        d="M140 138 C118 138 100 155 100 180 L100 192 C100 196 103 200 108 200 L172 200 C177 200 180 196 180 192 L180 180 C180 155 162 138 140 138 Z"
        fill="url(#person2)"
      />
    </G>
    
    {/* Right person */}
    <G transform="translate(55, 30)">
      <Circle cx="140" cy="110" r="22" fill="url(#person3)" />
      <Path
        d="M140 138 C118 138 100 155 100 180 L100 192 C100 196 103 200 108 200 L172 200 C177 200 180 196 180 192 L180 180 C180 155 162 138 140 138 Z"
        fill="url(#person3)"
      />
    </G>
    
    {/* Connection lines */}
    <Path
      d="M100 140 Q70 120 85 100"
      stroke="#4f46e5"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
      strokeDasharray="5,5"
      opacity="0.4"
    />
    <Path
      d="M180 140 Q210 120 195 100"
      stroke="#4f46e5"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
      strokeDasharray="5,5"
      opacity="0.4"
    />
    
    {/* Sparkles */}
    <Circle cx="60" cy="80" r="4" fill="#f59e0b" opacity="0.8" />
    <Circle cx="220" cy="70" r="3" fill="#06b6d4" opacity="0.8" />
    <Circle cx="240" cy="150" r="5" fill="#4f46e5" opacity="0.6" />
    <Circle cx="40" cy="160" r="4" fill="#f59e0b" opacity="0.6" />
  </Svg>
);

/**
 * Savings illustration - Piggy bank with coins
 */
export const SavingsIllustration: React.FC<IllustrationProps> = ({ 
  width = 280, 
  height = 280 
}) => (
  <Svg width={width} height={height} viewBox="0 0 280 280">
    <Defs>
      <LinearGradient id="piggy" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#f472b6" />
        <Stop offset="100%" stopColor="#ec4899" />
      </LinearGradient>
      <LinearGradient id="coin" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#fbbf24" />
        <Stop offset="100%" stopColor="#f59e0b" />
      </LinearGradient>
      <LinearGradient id="bgSave" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#fef3c7" />
        <Stop offset="100%" stopColor="#fde68a" />
      </LinearGradient>
    </Defs>
    
    {/* Background */}
    <Circle cx="140" cy="140" r="130" fill="url(#bgSave)" opacity="0.4" />
    
    {/* Shadow */}
    <Ellipse cx="140" cy="230" rx="80" ry="12" fill="#ec4899" opacity="0.15" />
    
    {/* Piggy bank body */}
    <Ellipse cx="140" cy="160" rx="70" ry="55" fill="url(#piggy)" />
    
    {/* Piggy ears */}
    <Ellipse cx="90" cy="115" rx="15" ry="20" fill="url(#piggy)" />
    <Ellipse cx="190" cy="115" rx="15" ry="20" fill="url(#piggy)" />
    <Ellipse cx="90" cy="115" rx="10" ry="14" fill="#f9a8d4" />
    <Ellipse cx="190" cy="115" rx="10" ry="14" fill="#f9a8d4" />
    
    {/* Piggy snout */}
    <Ellipse cx="140" cy="175" rx="25" ry="18" fill="#f9a8d4" />
    <Circle cx="132" cy="175" r="5" fill="#ec4899" />
    <Circle cx="148" cy="175" r="5" fill="#ec4899" />
    
    {/* Eyes */}
    <Circle cx="115" cy="145" r="8" fill="#ffffff" />
    <Circle cx="165" cy="145" r="8" fill="#ffffff" />
    <Circle cx="117" cy="145" r="4" fill="#1f2937" />
    <Circle cx="167" cy="145" r="4" fill="#1f2937" />
    
    {/* Coin slot */}
    <Rect x="125" y="105" width="30" height="6" rx="3" fill="#be185d" />
    
    {/* Legs */}
    <Rect x="95" y="200" width="18" height="25" rx="5" fill="url(#piggy)" />
    <Rect x="167" y="200" width="18" height="25" rx="5" fill="url(#piggy)" />
    
    {/* Flying coins */}
    <G>
      <Circle cx="70" cy="60" r="18" fill="url(#coin)" />
      <Circle cx="70" cy="60" r="12" fill="none" stroke="#d97706" strokeWidth="2" />
      <Path d="M67 55 L67 65 M70 53 L70 67" stroke="#d97706" strokeWidth="2" />
    </G>
    <G>
      <Circle cx="200" cy="45" r="15" fill="url(#coin)" />
      <Circle cx="200" cy="45" r="10" fill="none" stroke="#d97706" strokeWidth="2" />
    </G>
    <G>
      <Circle cx="230" cy="100" r="12" fill="url(#coin)" />
      <Circle cx="230" cy="100" r="8" fill="none" stroke="#d97706" strokeWidth="1.5" />
    </G>
    
    {/* Naira symbol on main coin */}
    <Path d="M66 58 L74 58 M68 62 L68 55 L72 65 L72 58" stroke="#92400e" strokeWidth="1.5" fill="none" />
  </Svg>
);

/**
 * Growth illustration - Chart going up with plant
 */
export const GrowthIllustration: React.FC<IllustrationProps> = ({ 
  width = 280, 
  height = 280 
}) => (
  <Svg width={width} height={height} viewBox="0 0 280 280">
    <Defs>
      <LinearGradient id="bgGrowth" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#d1fae5" />
        <Stop offset="100%" stopColor="#a7f3d0" />
      </LinearGradient>
      <LinearGradient id="chart" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#4f46e5" />
        <Stop offset="100%" stopColor="#6366f1" />
      </LinearGradient>
      <LinearGradient id="plant" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#22c55e" />
        <Stop offset="100%" stopColor="#16a34a" />
      </LinearGradient>
    </Defs>
    
    {/* Background */}
    <Circle cx="140" cy="140" r="130" fill="url(#bgGrowth)" opacity="0.4" />
    
    {/* Chart bars */}
    <Rect x="50" y="180" width="30" height="50" rx="5" fill="url(#chart)" opacity="0.6" />
    <Rect x="90" y="150" width="30" height="80" rx="5" fill="url(#chart)" opacity="0.75" />
    <Rect x="130" y="120" width="30" height="110" rx="5" fill="url(#chart)" opacity="0.85" />
    <Rect x="170" y="85" width="30" height="145" rx="5" fill="url(#chart)" />
    
    {/* Chart line */}
    <Path
      d="M65 175 Q95 165 105 145 Q115 125 145 115 Q160 105 185 80"
      stroke="#16a34a"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
    
    {/* Arrow at end */}
    <Path
      d="M180 90 L190 75 L195 92"
      stroke="#16a34a"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    
    {/* Plant pot */}
    <Path
      d="M210 200 L220 240 L260 240 L270 200 Z"
      fill="#d97706"
    />
    <Rect x="205" y="190" width="70" height="15" rx="3" fill="#f59e0b" />
    
    {/* Plant stem and leaves */}
    <Path
      d="M240 190 Q240 150 240 130"
      stroke="url(#plant)"
      strokeWidth="6"
      fill="none"
      strokeLinecap="round"
    />
    <Ellipse cx="225" cy="140" rx="20" ry="12" fill="url(#plant)" transform="rotate(-30, 225, 140)" />
    <Ellipse cx="255" cy="120" rx="18" ry="10" fill="url(#plant)" transform="rotate(30, 255, 120)" />
    <Ellipse cx="230" cy="100" rx="15" ry="8" fill="url(#plant)" transform="rotate(-20, 230, 100)" />
    <Ellipse cx="250" cy="85" rx="12" ry="7" fill="url(#plant)" transform="rotate(25, 250, 85)" />
    
    {/* Sparkles */}
    <Circle cx="60" cy="80" r="5" fill="#f59e0b" opacity="0.8" />
    <Circle cx="220" cy="55" r="4" fill="#4f46e5" opacity="0.8" />
    <Circle cx="30" cy="150" r="4" fill="#22c55e" opacity="0.7" />
  </Svg>
);

/**
 * Secure illustration - Shield with lock
 */
export const SecureIllustration: React.FC<IllustrationProps> = ({ 
  width = 280, 
  height = 280 
}) => (
  <Svg width={width} height={height} viewBox="0 0 280 280">
    <Defs>
      <LinearGradient id="bgSecure" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#dbeafe" />
        <Stop offset="100%" stopColor="#bfdbfe" />
      </LinearGradient>
      <LinearGradient id="shield" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#6366f1" />
        <Stop offset="100%" stopColor="#4f46e5" />
      </LinearGradient>
      <LinearGradient id="shieldInner" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#06b6d4" />
        <Stop offset="100%" stopColor="#0891b2" />
      </LinearGradient>
    </Defs>
    
    {/* Background */}
    <Circle cx="140" cy="140" r="130" fill="url(#bgSecure)" opacity="0.4" />
    
    {/* Shield outer */}
    <Path
      d="M140 40 L220 70 L220 140 C220 190 180 230 140 250 C100 230 60 190 60 140 L60 70 Z"
      fill="url(#shield)"
    />
    
    {/* Shield inner */}
    <Path
      d="M140 60 L200 85 L200 140 C200 180 170 210 140 225 C110 210 80 180 80 140 L80 85 Z"
      fill="url(#shieldInner)"
    />
    
    {/* Lock body */}
    <Rect x="110" y="130" width="60" height="50" rx="8" fill="#ffffff" />
    
    {/* Lock shackle */}
    <Path
      d="M118 130 L118 110 C118 90 162 90 162 110 L162 130"
      stroke="#ffffff"
      strokeWidth="10"
      fill="none"
      strokeLinecap="round"
    />
    
    {/* Keyhole */}
    <Circle cx="140" cy="148" r="8" fill="#4f46e5" />
    <Rect x="136" y="148" width="8" height="18" rx="2" fill="#4f46e5" />
    
    {/* Check mark */}
    <Path
      d="M125 200 L138 215 L165 185"
      stroke="#22c55e"
      strokeWidth="6"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    
    {/* Stars */}
    <Circle cx="50" cy="80" r="4" fill="#f59e0b" opacity="0.8" />
    <Circle cx="230" cy="60" r="5" fill="#4f46e5" opacity="0.7" />
    <Circle cx="240" cy="180" r="4" fill="#06b6d4" opacity="0.8" />
    <Circle cx="40" cy="190" r="3" fill="#f59e0b" opacity="0.7" />
  </Svg>
);

export default {
  CommunityIllustration,
  SavingsIllustration,
  GrowthIllustration,
  SecureIllustration,
};
