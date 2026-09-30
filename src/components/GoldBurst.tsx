import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

const COLORS = ['#ffe49a', '#e4ae39', '#fff6d8', '#dfc681', '#ffffff'];

type Props = {
  token: number;
};

/** A short particle burst. `token` increments once per ★ ĐẶC BIỆT reveal. */
export function GoldBurst({ token }: Props) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 22 }, (_, index) => ({
        id: index,
        color: COLORS[index % COLORS.length],
        x: (index - 11) * 14,
        delay: (index % 5) * 20,
        rotate: index % 2 === 0 ? '18deg' : '-16deg',
      })),
    [],
  );
  const progress = useRef(pieces.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (token === 0) return;
    const animations = progress.map((value, index) => {
      value.setValue(0);
      return Animated.timing(value, {
        toValue: 1,
        duration: 900,
        delay: pieces[index].delay,
        useNativeDriver: true,
      });
    });
    Animated.parallel(animations).start();
  }, [pieces, progress, token]);

  if (token === 0) return null;

  return (
    <View pointerEvents="none" style={styles.layer}>
      {pieces.map((piece, index) => {
        const translateY = progress[index].interpolate({
          inputRange: [0, 1],
          outputRange: [0, 220 + (index % 4) * 28],
        });
        const translateX = progress[index].interpolate({
          inputRange: [0, 1],
          outputRange: [0, piece.x],
        });
        const opacity = progress[index].interpolate({
          inputRange: [0, 0.15, 1],
          outputRange: [0, 1, 0],
        });
        return (
          <Animated.View
            key={piece.id}
            style={[
              styles.bit,
              {
                backgroundColor: piece.color,
                opacity,
                transform: [{ translateX }, { translateY }, { rotate: piece.rotate }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  bit: {
    position: 'absolute',
    width: 8,
    height: 12,
  },
});
