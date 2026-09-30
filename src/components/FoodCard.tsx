import { memo, useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { categoryLabel } from '../lib/categories';
import type { Food } from '../lib/foods';
import { colors, formatDong, rarityColors, tiers, TILE_HEIGHT, TILE_WIDTH } from '../lib/theme';
import { FoodImage } from './FoodImage';
import { MysteryArt } from './MysteryArt';

type Props = {
  food: Food;
  small?: boolean;
  mystery?: boolean;
  shine?: boolean;
  style?: StyleProp<ViewStyle>;
};

function RareShine({ active }: { active: boolean }) {
  const sheen = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sheen, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(2200),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, sheen]);
  if (!active) return null;
  const translateX = sheen.interpolate({ inputRange: [0, 1], outputRange: [-160, 220] });
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.shine, { transform: [{ translateX }, { rotate: '18deg' }] }]}
    />
  );
}

function FoodCardInner({ food, small = false, mystery = false, shine = false, style }: Props) {
  const rarity = rarityColors[food.rarity];
  const hideIdentity = mystery && food.rarity === 4 && !small;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.card,
        small ? styles.small : styles.reel,
        hideIdentity ? styles.mystery : null,
        { borderBottomColor: hideIdentity ? '#ffd76c' : rarity },
        style,
      ]}
    >
      <Text style={[styles.tier, { color: hideIdentity ? colors.goldMystery : rarity }]} numberOfLines={1}>
        {hideIdentity ? '★' : tiers[food.rarity]}
      </Text>
      {hideIdentity ? <MysteryArt /> : <FoodImage food={food} style={small ? styles.smallImage : styles.reelImage} />}
      <RareShine active={shine && food.rarity >= 3 && !hideIdentity} />
      <View style={[styles.copy, small ? styles.smallCopy : styles.reelCopy, hideIdentity && styles.mysteryCopy]}>
        {small ? (
          <Text style={styles.category} numberOfLines={1}>
            {categoryLabel(food.category)}
          </Text>
        ) : null}
        <Text
          numberOfLines={2}
          style={[styles.name, small ? styles.smallName : styles.reelName, hideIdentity && styles.mysteryName]}
        >
          {hideIdentity ? '★ MÓN BÍ ẨN' : food.name}
        </Text>
        {small ? (
          <Text style={styles.price}>{formatDong(food.price)}</Text>
        ) : hideIdentity ? null : (
          <Text style={styles.sub} numberOfLines={1}>
            {food.sub}
          </Text>
        )}
      </View>
    </View>
  );
}

export const FoodCard = memo(FoodCardInner);

const styles = StyleSheet.create({
  card: {
    borderBottomWidth: 7,
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
  reel: {
    width: TILE_WIDTH,
    height: TILE_HEIGHT,
    backgroundColor: colors.cardInner,
  },
  small: {
    borderBottomWidth: 5,
    paddingBottom: 10,
    flex: 1,
  },
  mystery: {
    backgroundColor: '#171b20',
  },
  reelImage: {
    width: 150,
    height: 150,
    alignSelf: 'center',
    backgroundColor: 'transparent',
  },
  smallImage: {
    width: '100%',
    aspectRatio: 1,
  },
  copy: {
    paddingHorizontal: 12,
  },
  reelCopy: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 8,
    backgroundColor: '#18232bdd',
    minHeight: 38,
    justifyContent: 'flex-end',
  },
  smallCopy: {
    marginTop: 6,
    gap: 4,
    paddingHorizontal: 8,
  },
  mysteryCopy: {
    backgroundColor: '#231b0ff2',
    alignItems: 'center',
  },
  name: {
    color: colors.text,
    fontWeight: '400',
  },
  reelName: {
    fontSize: 16,
  },
  smallName: {
    fontSize: 13,
  },
  mysteryName: {
    color: colors.goldMystery,
    letterSpacing: 2,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  tier: {
    position: 'absolute',
    top: 6,
    left: 8,
    zIndex: 2,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  category: {
    fontSize: 10,
    color: '#a3a59b',
    letterSpacing: 0.2,
  },
  shine: {
    position: 'absolute',
    top: -20,
    width: 28,
    bottom: -20,
    backgroundColor: '#ffffff55',
    zIndex: 2,
  },
  sub: {
    display: 'none',
    fontSize: 12,
    color: colors.muted,
  },
  price: {
    fontSize: 12,
    color: '#bfc5cc',
  },
});
