import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path, G, Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { colors as colorTheme } from '../../theme';

interface LogoProps {
  size?: number;
  showText?: boolean;
  textColor?: string;
}

/**
 * CooperativeManager Logo - AI-designed logo representing community,
 * trust, and financial cooperation
 * 
 * Design concept: Three interconnected figures forming a circular bond,
 * symbolizing unity and cooperative spirit with a coin/financial element
 */
const Logo: React.FC<LogoProps> = ({ 
  size = 80, 
  showText = false,
  textColor = colorTheme.text.primary 
}) => {
  const scale = size / 100;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          {/* Primary gradient - indigo to purple */}
          <LinearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#6366f1" />
            <Stop offset="50%" stopColor="#4f46e5" />
            <Stop offset="100%" stopColor="#3730a3" />
          </LinearGradient>
          
          {/* Secondary gradient - teal accent */}
          <LinearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#06b6d4" />
            <Stop offset="100%" stopColor="#0891b2" />
          </LinearGradient>

          {/* Subtle shadow gradient */}
          <LinearGradient id="shadowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#4f46e5" stopOpacity="0.3" />
            <Stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Background circle with gradient */}
        <Circle cx="50" cy="50" r="48" fill="url(#primaryGrad)" />
        
        {/* Inner decorative ring */}
        <Circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        
        {/* Three connected people forming cooperative symbol */}
        <G>
          {/* Top person */}
          <Circle cx="50" cy="28" r="8" fill="#ffffff" />
          <Path
            d="M50 38 C42 38 36 44 36 52 L36 56 C36 57 37 58 38 58 L62 58 C63 58 64 57 64 56 L64 52 C64 44 58 38 50 38 Z"
            fill="#ffffff"
            opacity="0.9"
          />
          
          {/* Bottom left person */}
          <Circle cx="30" cy="58" r="7" fill="url(#accentGrad)" />
          <Path
            d="M30 66 C24 66 19 70 19 76 L19 79 C19 80 20 81 21 81 L39 81 C40 81 41 80 41 79 L41 76 C41 70 36 66 30 66 Z"
            fill="url(#accentGrad)"
            opacity="0.9"
          />
          
          {/* Bottom right person */}
          <Circle cx="70" cy="58" r="7" fill="url(#accentGrad)" />
          <Path
            d="M70 66 C64 66 59 70 59 76 L59 79 C59 80 60 81 61 81 L79 81 C80 81 81 80 81 79 L81 76 C81 70 76 66 70 66 Z"
            fill="url(#accentGrad)"
            opacity="0.9"
          />
          
          {/* Connecting handshake/unity lines */}
          <Path
            d="M38 52 Q34 55 30 58"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          <Path
            d="M62 52 Q66 55 70 58"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          
          {/* Coin/financial symbol in center */}
          <Circle cx="50" cy="68" r="10" fill="#ffffff" opacity="0.95" />
          <SvgText
            x="50"
            y="73"
            fontSize="14"
            fontWeight="bold"
            fill="#4f46e5"
            textAnchor="middle"
          >
            ₦
          </SvgText>
        </G>
      </Svg>
      
      {showText && (
        <View style={styles.textContainer}>
          <Text style={[styles.logoText, { color: textColor }]}>CoopManager</Text>
          <Text style={[styles.tagline, { color: textColor, opacity: 0.7 }]}>
            Together We Prosper
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  textContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 12,
    marginTop: 4,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});

export default Logo;
