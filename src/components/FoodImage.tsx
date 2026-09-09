import { Image } from 'expo-image';
import { memo, useCallback, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { Food } from '../lib/foods';
import { spriteFor } from '../lib/sprite';
import { colors } from '../lib/theme';

type Props = {
  food: Food;
  style?: StyleProp<ViewStyle>;
};

function FoodImageInner({ food, style }: Props) {
  const sprite = spriteFor(food.image);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setBox((prev) => (prev.w === width && prev.h === height ? prev : { w: width, h: height }));
  }, []);

  const cellH = sprite.lunch && box.h ? box.h / 0.93 : box.h;

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={food.name}
      onLayout={onLayout}
      style={[styles.clip, style]}
    >
      {box.w > 0 && box.h > 0 ? (
        <Image
          source={{ uri: sprite.uri }}
          cachePolicy="disk"
          contentFit="fill"
          style={{
            position: 'absolute',
            width: box.w * sprite.cols,
            height: cellH * sprite.rows,
            left: -sprite.col * box.w,
            top: -sprite.rowShift * cellH,
            backgroundColor: colors.cardInner,
          }}
        />
      ) : null}
    </View>
  );
}

export const FoodImage = memo(FoodImageInner);

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
    backgroundColor: colors.cardInner,
  },
});
