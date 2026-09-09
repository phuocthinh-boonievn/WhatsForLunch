import { memo, useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useReducedMotion } from '../hooks/use-reduced-motion';

function MysteryArtInner() {
  const reduced = useReducedMotion();
  const sheen = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.timing(sheen, {
        toValue: 1,
        duration: 4800,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [reduced, sheen]);

  const translateX = sheen.interpolate({
    inputRange: [0, 0.2, 0.6, 1],
    outputRange: [-180, -180, 180, 180],
  });

  return (
    <View style={styles.art} accessibilityRole="image" accessibilityLabel="Món bí ẩn hạng vàng">
      <View style={styles.rays} />
      <Svg style={styles.emblem} viewBox="0 0 240 150" width="100%" height={150}>
        <Path
          fill="none"
          stroke="#dfaf46"
          strokeWidth={0.7}
          strokeDasharray="18 5"
          opacity={0.65}
          d="M120 5 174 27 193 75 174 123 120 145 66 123 47 75 66 27Z"
        />
        <Path
          fill="#b27a16"
          d="m120 10 16 38 44-18-18 38 55 7-55 14 18 34-44-16-16 33-16-33-44 16 18-34-55-14 55-7-18-38 44 18Z"
        />
        <Path
          fill="#ffe59a"
          d="m120 18 13 41 38-21-23 35 49 2-49 10 23 31-38-18-13 34-13-34-38 18 23-31-49-10 49-2-23-35 38 21Z"
        />
        <Path
          fill="#372414"
          stroke="#eac366"
          strokeWidth={2}
          d="m120 34 35 20 0 42-35 20-35-20V54Z"
        />
        <Path
          fill="#fff3ba"
          d="M104 61c0-22 36-24 36-2 0 10-12 13-13 20v4h-13v-6c0-9 12-12 12-18 0-8-11-7-11 2zm10 28h13v13h-13z"
        />
        <Path
          fill="#fff5ce"
          d="m34 29 3 7 8 2-8 3-3 8-2-8-8-3 8-2zm164 66 3 9 10 2-10 3-3 10-3-10-9-3 9-2zM186 19l3 3-3 3-3-3zM52 117l3 3-3 3-3-3z"
        />
      </Svg>
      {reduced ? null : (
        <Animated.View
          pointerEvents="none"
          style={[styles.sheen, { transform: [{ translateX }, { rotate: '20deg' }] }]}
        />
      )}
    </View>
  );
}

export const MysteryArt = memo(MysteryArtInner);

const styles = StyleSheet.create({
  art: {
    height: 150,
    overflow: 'hidden',
    position: 'relative',
  },
  rays: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#ffda6a18',
  },
  emblem: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
  sheen: {
    position: 'absolute',
    top: -30,
    bottom: -30,
    width: 80,
    backgroundColor: '#fff1ba55',
  },
});
