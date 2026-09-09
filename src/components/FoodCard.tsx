import { memo } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { Food } from '../lib/foods';
import { colors, rarityColors, TILE_HEIGHT, TILE_WIDTH } from '../lib/theme';
import { FoodImage } from './FoodImage';
import { MysteryArt } from './MysteryArt';

type Props = {
  food: Food;
  small?: boolean;
  mystery?: boolean;
  style?: StyleProp<ViewStyle>;
};

function FoodCardInner({ food, small = false, mystery = false, style }: Props) {
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
      {hideIdentity ? <MysteryArt /> : <FoodImage food={food} style={small ? styles.smallImage : styles.reelImage} />}
      <View style={[styles.copy, small ? styles.smallCopy : styles.reelCopy, hideIdentity && styles.mysteryCopy]}>
        <Text
          numberOfLines={2}
          style={[styles.name, small ? styles.smallName : styles.reelName, hideIdentity && styles.mysteryName]}
        >
          {hideIdentity ? '★ MÓN BÍ ẨN' : food.name}
        </Text>
        {small ? (
          <Text style={styles.price}>~{food.price}.000đ</Text>
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
