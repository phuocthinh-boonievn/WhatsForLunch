import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Food } from '../lib/foods';
import { GOLDEN_KNIFE } from '../lib/surprises';
import { colors, formatDong, rarityColors, tiers } from '../lib/theme';
import { FoodImage } from './FoodImage';

type Props = {
  food: Food | null;
  visible: boolean;
  knife?: boolean;
  onContinue: () => void;
  onReplay: () => void;
};

function grabUrl(name: string) {
  const params = new URLSearchParams({
    search: name,
    'support-deeplink': 'true',
    searchParameter: name,
  });
  return `https://food.grab.com/vn/vi/restaurants?${params.toString()}`;
}

export function WinnerModal({ food, visible, knife = false, onContinue, onReplay }: Props) {
  if (!food) return null;

  const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(`${food.name} gần đây`)}`;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onContinue}>
      <View style={styles.overlay}>
        <Text style={styles.label}>MÓN CỦA BẠN</Text>
        <Text style={styles.tier}>{tiers[food.rarity]}</Text>
        <Text style={styles.title}>{food.name}</Text>
        <Text style={styles.description}>Giá tham khảo · {formatDong(food.price)} / người</Text>
        {knife && food.rarity === 4 ? (
          <Text style={styles.knife}>{GOLDEN_KNIFE.name} · {GOLDEN_KNIFE.quip}</Text>
        ) : null}
        <View style={[styles.art, { borderBottomColor: rarityColors[food.rarity] }]}>
          <FoodImage food={food} style={styles.image} />
        </View>
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="link"
            style={styles.find}
            onPress={() => void Linking.openURL(mapsUrl)}
          >
            <Text style={styles.findText}>TÌM QUÁN ↗</Text>
          </Pressable>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`Đặt ${food.name} qua GrabFood`}
            style={styles.grab}
            onPress={() => void Linking.openURL(grabUrl(food.name))}
          >
            <Text style={styles.grabText}>Đặt qua GrabFood ↗</Text>
          </Pressable>
          <Pressable onPress={onContinue} style={styles.textBtn}>
            <Text style={styles.textBtnLabel}>TIẾP TỤC</Text>
          </Pressable>
          <Pressable onPress={onReplay} style={styles.textBtn}>
            <Text style={styles.textBtnLabel}>MỞ LẠI</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  label: {
    fontSize: 13,
    letterSpacing: 2,
    color: '#b6c2ca',
  },
  tier: {
    fontSize: 12,
    letterSpacing: 1,
    color: colors.goldText,
    fontWeight: '600',
  },
  knife: {
    fontSize: 13,
    color: colors.goldMystery,
    textAlign: 'center',
    maxWidth: 420,
    marginTop: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '400',
    color: colors.text,
    textAlign: 'center',
    marginVertical: 4,
  },
  description: {
    fontSize: 16,
    color: '#aebbc5',
    textAlign: 'center',
  },
  art: {
    marginVertical: 20,
    width: '80%',
    maxWidth: 480,
    backgroundColor: colors.cardInner,
    borderBottomWidth: 3,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 16,
    width: '100%',
    maxWidth: 750,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#ffffff25',
  },
  find: {
    backgroundColor: colors.find,
    borderWidth: 1,
    borderColor: '#9cb88070',
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginRight: 'auto',
  },
  findText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  grab: {
    borderWidth: 1,
    borderColor: '#9cb88070',
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  grabText: {
    color: colors.goldText,
    fontSize: 14,
    fontWeight: '500',
  },
  textBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  textBtnLabel: {
    color: colors.text,
    fontSize: 14,
  },
});
