import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BudgetPicker } from '../components/BudgetPicker';
import { FoodCard } from '../components/FoodCard';
import { WinnerModal } from '../components/WinnerModal';
import { useGlobalSpinCount } from '../hooks/use-global-spin-count';
import { useReducedMotion } from '../hooks/use-reduced-motion';
import { CaseAudio } from '../lib/case-audio';
import {
  createFoodSelector,
  createSpinProfile,
  spinProgress,
  stopFraction,
} from '../lib/case-mechanics';
import { foods, type Food } from '../lib/foods';
import {
  ASSET_BASE,
  colors,
  DEFAULT_BUDGET,
  INITIAL_REEL_X,
  MAX_BUDGET,
  MIN_BUDGET,
  REEL_VISIBLE,
  REVEAL_SOUNDS,
  TILE_HEIGHT,
  TILE_STEP,
  TILE_WIDTH,
} from '../lib/theme';

type ReelItem = { food: Food; id: number };

function newId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const { count: globalSpins, recordSpin } = useGlobalSpinCount();

  const [budget, setBudget] = useState(DEFAULT_BUDGET);
  const [custom, setCustom] = useState(DEFAULT_BUDGET);
  const [veg, setVeg] = useState(false);
  const [sound, setSound] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [moving, setMoving] = useState(false);
  const [result, setResult] = useState<Food | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [reel, setReel] = useState<ReelItem[]>(() =>
    foods.slice(0, 12).map((food, id) => ({ food, id })),
  );
  const [visibleStart, setVisibleStart] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(windowWidth);

  const busy = useRef(false);
  const position = useRef(INITIAL_REEL_X);
  const translateX = useRef(new Animated.Value(INITIAL_REEL_X)).current;
  const frame = useRef<number | null>(null);
  const audio = useRef<CaseAudio | null>(null);

  useEffect(() => {
    const engine = new CaseAudio();
    audio.current = engine;
    void engine.preload();
    return () => {
      engine.dispose();
      audio.current = null;
      if (frame.current != null) cancelAnimationFrame(frame.current);
    };
  }, []);

  const target = budget === 'custom' ? Number(custom) : Number(budget);
  const validTarget = Number.isInteger(target) && target >= MIN_BUDGET && target <= MAX_BUDGET;
  const lunchSelector = useMemo(
    () => createFoodSelector(foods, validTarget ? target : 50),
    [target, validTarget],
  );
  const eligible = useMemo(() => foods.filter((f) => !veg || f.veg), [veg]);
  const filteredMean = lunchSelector.meanFor(eligible);

  const inventory = useMemo(
    () =>
      [...eligible].sort(
        (a, b) => a.rarity - b.rarity || a.price - b.price || a.name.localeCompare(b.name, 'vi'),
      ),
    [eligible],
  );

  const columns = windowWidth >= 900 ? 6 : windowWidth >= 640 ? 4 : 3;

  const open = useCallback(() => {
    if (busy.current || !validTarget || !eligible.length) return;
    audio.current?.unlock();
    busy.current = true;

    const winner = lunchSelector.choose(eligible);
    const spinId = newId();
    const width = viewportWidth || windowWidth;
    const start = position.current;
    const center = Math.floor((width / 2 - start) / TILE_STEP);
    const profile = createSpinProfile();
    const landing = center + profile.tiles;
    const end = width / 2 - TILE_WIDTH * stopFraction() - landing * TILE_STEP;
    const rightEdge = Math.ceil((width - start) / TILE_STEP) + 1;
    const items = reel.filter(
      (item) => item.id >= center - Math.ceil(width / TILE_STEP) - 2 && item.id <= rightEdge,
    );
    const last = items.length ? Math.max(...items.map((item) => item.id)) : -1;
    const recent: Food[] = [];
    for (let id = last + 1; id <= landing + 4; id++) {
      const alternatives = eligible.filter((food) => !recent.includes(food));
      const food = id === landing ? winner : lunchSelector.choose(alternatives.length ? alternatives : eligible);
      items.push({ id, food });
      recent.push(food);
      if (recent.length > 8) recent.shift();
    }

    setReel(items);
    setSpinning(true);
    setMoving(true);
    setResult(null);
    audio.current?.play('csgo_ui_crate_open');

    const duration = reducedMotion ? 150 : profile.durationMs;
    const started = performance.now();
    let renderedStart = visibleStart;
    let lastCell = Math.floor((start - width / 2) / TILE_STEP);

    const animate = (now: number) => {
      const progress = Math.max(0, Math.min(1, (now - started) / duration));
      const next = start + (end - start) * spinProgress(progress, profile.friction);
      position.current = next;
      translateX.setValue(next);
      const firstVisible = Math.max(0, Math.floor(-next / TILE_STEP));
      if (firstVisible - renderedStart >= 4 || firstVisible < renderedStart) {
        renderedStart = Math.max(0, firstVisible - 2);
        setVisibleStart(renderedStart);
      }
      const cell = Math.floor((next - width / 2) / TILE_STEP);
      if (cell !== lastCell) {
        audio.current?.play('csgo_ui_crate_item_scroll');
        lastCell = cell;
      }
      if (progress < 1) {
        frame.current = requestAnimationFrame(animate);
        return;
      }
      void recordSpin(spinId);
      busy.current = false;
      setSpinning(false);
      setMoving(false);
      setResult(winner);
      setRevealed(true);
      audio.current?.play(REVEAL_SOUNDS[winner.rarity]);
    };
    frame.current = requestAnimationFrame(animate);
  }, [
    eligible,
    lunchSelector,
    recordSpin,
    reducedMotion,
    reel,
    translateX,
    validTarget,
    viewportWidth,
    visibleStart,
    windowWidth,
  ]);

  const vegNote =
    veg && validTarget ? `Pool chay: trung bình ~${Math.round(filteredMean)}.000đ / bữa` : null;

  const visibleTiles = reel.filter(({ id }) => id >= visibleStart && id < visibleStart + REEL_VISIBLE);

  return (
    <View style={styles.bg}>
      <Image
        source={{ uri: `${ASSET_BASE}/warehouse.png` }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        pointerEvents="none"
      />
      <LinearGradient
        colors={['rgba(24,36,46,0.87)', 'rgba(37,50,61,0.85)']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={[styles.shell, { paddingTop: insets.top }]}>
        <ScrollView
          contentContainerStyle={[styles.page, { paddingBottom: 28 + insets.bottom }]}
          scrollEnabled={!moving}
        >
          <View style={styles.header}>
            <Text style={styles.brand}>truanayangi.</Text>
            <Pressable
              accessibilityLabel={sound ? 'Tắt âm thanh' : 'Bật âm thanh'}
              onPress={() => {
                audio.current?.setMuted(sound);
                setSound(!sound);
              }}
              style={styles.sound}
            >
              <Text style={styles.soundText}>
                {sound ? '🔊' : '🔇'} Âm thanh {sound ? 'bật' : 'tắt'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.intro}>
            <Text style={styles.title}>Mở hòm ăn trưa</Text>
          </View>
          <Text
            style={styles.counter}
            accessibilityLabel="Tổng số lượt quay hoàn tất của mọi người, tính từ khi bật bộ đếm"
          >
            Cư dân mạng đã mở{' '}
            <Text style={styles.counterStrong}>
              {globalSpins === null ? '—' : new Intl.NumberFormat('vi-VN').format(globalSpins)}
            </Text>{' '}
            hòm
          </Text>

          <View
            style={styles.panel}
            onLayout={(e) => setViewportWidth(e.nativeEvent.layout.width)}
          >
            <View style={styles.reelWindow}>
              <View style={styles.selector} pointerEvents="none" />
              <Animated.View style={[styles.track, { transform: [{ translateX }] }]}>
                {visibleTiles.map(({ food, id }) => (
                  <View key={id} style={[styles.slot, { left: id * TILE_STEP }]}>
                    <FoodCard food={food} mystery />
                  </View>
                ))}
              </Animated.View>
              <View style={[styles.fade, styles.fadeLeft]} pointerEvents="none" />
              <View style={[styles.fade, styles.fadeRight]} pointerEvents="none" />
            </View>
          </View>

          <View style={styles.controls}>
            <View style={styles.filters}>
              <BudgetPicker
                budget={budget}
                custom={custom}
                disabled={spinning}
                valid={validTarget}
                vegNote={vegNote}
                onBudget={setBudget}
                onCustom={setCustom}
              />
              <View style={styles.veg}>
                <Switch
                  value={veg}
                  onValueChange={setVeg}
                  disabled={spinning}
                  trackColor={{ false: '#465562', true: colors.buttonTop }}
                  thumbColor="#fff"
                  accessibilityLabel="Chỉ ăn chay"
                />
                <Text style={styles.vegLabel}>🌿 Ăn chay</Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              disabled={spinning || !validTarget || !eligible.length}
              onPress={open}
              style={(spinning || !validTarget) && styles.openDisabled}
            >
              <LinearGradient
                colors={[colors.buttonTop, colors.buttonBottom]}
                style={styles.open}
              >
                <Text style={styles.openText}>
                  {spinning ? 'ĐANG MỞ HÒM…' : result ? 'MỞ LẠI' : 'MỞ HÒM'}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>

          <View style={styles.inventory}>
            <Text style={styles.eyebrow}>TRONG HÒM CÓ GÌ?</Text>
            <Text style={styles.sectionTitle}>
              Vật phẩm trong hòm{' '}
              <Text style={styles.countBadge}>{eligible.length.toString().padStart(2, '0')}</Text>
            </Text>
            <View style={styles.grid}>
              {inventory.map((food) => (
                <View key={food.name} style={{ width: `${100 / columns}%`, padding: 3.5 }}>
                  <FoodCard food={food} small />
                </View>
              ))}
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerBrand}>truanayangi.</Text>
            <Text style={styles.footerNote}>Fan-made · SFX: Valve / SourceSounds</Text>
          </View>
        </ScrollView>
      </View>

      <WinnerModal
        food={result}
        visible={revealed}
        onContinue={() => setRevealed(false)}
        onReplay={() => {
          setRevealed(false);
          setTimeout(() => open(), 40);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.warehouse },
  shell: { flex: 1 },
  page: {
    paddingHorizontal: 18,
    maxWidth: 1240,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff20',
    marginHorizontal: -18,
    paddingHorizontal: 18,
    backgroundColor: '#101a2370',
  },
  brand: {
    fontSize: 20,
    fontWeight: '500',
    color: colors.text,
  },
  sound: {
    paddingVertical: 10,
  },
  soundText: {
    color: '#b9c0c5',
    fontSize: 14,
  },
  intro: {
    marginTop: 30,
    marginBottom: 8,
  },
  title: {
    fontSize: 27,
    fontWeight: '400',
    color: colors.text,
  },
  counter: {
    textAlign: 'center',
    marginBottom: 18,
    color: '#abb8c2',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  counterStrong: {
    fontWeight: '500',
    color: colors.goldText,
    fontVariant: ['tabular-nums'],
  },
  panel: {
    backgroundColor: '#17232c88',
    borderWidth: 1,
    borderColor: '#ffffff32',
    maxWidth: 1050,
    alignSelf: 'center',
    width: '100%',
  },
  reelWindow: {
    height: 230,
    paddingVertical: 25,
    overflow: 'hidden',
    backgroundColor: '#17232c55',
  },
  selector: {
    position: 'absolute',
    left: '50%',
    marginLeft: -1.5,
    top: 23,
    bottom: 23,
    width: 3,
    backgroundColor: colors.gold,
    zIndex: 3,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  track: {
    position: 'relative',
    height: TILE_HEIGHT,
    width: '100%',
  },
  slot: {
    position: 'absolute',
    top: 0,
    width: TILE_WIDTH,
    height: TILE_HEIGHT,
  },
  fade: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '13%',
    zIndex: 2,
  },
  fadeLeft: {
    left: 0,
    backgroundColor: '#1c283ac9',
  },
  fadeRight: {
    right: 0,
    backgroundColor: '#1c283ac9',
  },
  controls: {
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff28',
    paddingBottom: 26,
    marginTop: 24,
    marginBottom: 30,
    gap: 20,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    gap: 18,
    justifyContent: 'space-between',
  },
  veg: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 8,
  },
  vegLabel: {
    color: '#ced3d6',
    fontSize: 14,
  },
  open: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.buttonBottom,
    borderWidth: 1,
    borderColor: '#9fb98460',
    paddingVertical: 15,
    minWidth: 200,
  },
  openDisabled: {
    opacity: 0.65,
  },
  openText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  inventory: {
    marginBottom: 16,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2,
    color: '#a3a59b',
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '400',
    color: colors.text,
    marginBottom: 16,
  },
  countBadge: {
    fontSize: 12,
    color: '#a0a29a',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -3.5,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#ffffff20',
    marginTop: 35,
    paddingVertical: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
  },
  footerBrand: {
    fontSize: 12,
    color: colors.dim,
  },
  footerNote: {
    fontSize: 12,
    color: colors.dim,
    flex: 1,
    textAlign: 'right',
  },
});
