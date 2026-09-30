import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Linking,
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
import { GoldBurst } from '../components/GoldBurst';
import { WinnerModal } from '../components/WinnerModal';
import { useGlobalSpinCount } from '../hooks/use-global-spin-count';
import { useReducedMotion } from '../hooks/use-reduced-motion';
import { useShakeToOpen } from '../hooks/use-shake-to-open';
import { CaseAudio } from '../lib/case-audio';
import {
  BUDGET_SLOTS,
  budgetLabel,
  budgetTargetFor,
  clampTarget,
  createFoodSelector,
  createSpinProfile,
  spinProgress,
  stopFraction,
  type BudgetSlot,
} from '../lib/case-mechanics';
import { foodKey, foods, type Food } from '../lib/foods';
import { KINDS, MEAL_SEGMENTS, mealSegmentForHour, poolFor, priceBounds, type MealSegment } from '../lib/pool';
import {
  applyTitleTap,
  GOLDEN_KNIFE,
  nextRareStreak,
  shouldCelebrateGold,
  shouldHaptic,
  type TapState,
} from '../lib/surprises';
import {
  colors,
  DEFAULT_BUDGET,
  formatDong,
  INITIAL_REEL_X,
  REEL_VISIBLE,
  REVEAL_SOUNDS,
  TILE_HEIGHT,
  TILE_STEP,
  TILE_WIDTH,
  WAREHOUSE_ART,
} from '../lib/theme';
import type { MealKind } from '../lib/case-mechanics';

type ReelItem = { food: Food; id: number };

function newId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

function haptic(kind: 'tick' | 'reveal', rarity = 0) {
  const pulse =
    kind === 'tick'
      ? Haptics.selectionAsync()
      : Haptics.notificationAsync(
          rarity >= 4
            ? Haptics.NotificationFeedbackType.Success
            : Haptics.NotificationFeedbackType.Warning,
        );
  void pulse.catch(() => {});
}

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const { count: globalSpins, recordSpin } = useGlobalSpinCount();

  const [kind, setKind] = useState<MealKind>('food');
  const [segment, setSegment] = useState<MealSegment>(() => mealSegmentForHour(new Date().getHours()));
  const [budget, setBudget] = useState(DEFAULT_BUDGET);
  const [custom, setCustom] = useState('50');
  const [veg, setVeg] = useState(false);
  const [sound, setSound] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [moving, setMoving] = useState(false);
  const [result, setResult] = useState<Food | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [reel, setReel] = useState<ReelItem[]>(() =>
    foods.filter((food) => food.kind === 'food').slice(0, 12).map((food, id) => ({ food, id })),
  );
  const [visibleStart, setVisibleStart] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(windowWidth);
  const [sessionOpens, setSessionOpens] = useState(0);
  const [rareStreak, setRareStreak] = useState(0);
  const [knife, setKnife] = useState(false);
  const [burst, setBurst] = useState(0);

  const busy = useRef(false);
  const position = useRef(INITIAL_REEL_X);
  const translateX = useRef(new Animated.Value(INITIAL_REEL_X)).current;
  const shakeX = useRef(new Animated.Value(0)).current;
  const frame = useRef<number | null>(null);
  const audio = useRef<CaseAudio | null>(null);
  const soundRef = useRef(sound);
  const reducedRef = useRef(reducedMotion);
  const taps = useRef<TapState | null>(null);
  soundRef.current = sound;
  reducedRef.current = reducedMotion;

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

  const population = useMemo(() => poolFor(foods, kind, segment), [kind, segment]);
  const bounds = useMemo(() => priceBounds(population), [population]);
  const requested = budget === 'custom' ? Number(custom) : budgetTargetFor(kind, budget as BudgetSlot);
  const customValid =
    Number.isInteger(requested) && bounds.max > 0 && requested >= bounds.min && requested <= bounds.max;
  const validTarget = budget === 'custom' ? customValid : population.length > 0;
  const fitted = validTarget ? clampTarget(population.map((food) => food.price), requested) : null;
  const selector = useMemo(
    () => (population.length && fitted != null ? createFoodSelector(population, fitted) : null),
    [population, fitted],
  );
  const vegOn = kind === 'food' && veg;
  const eligible = useMemo(() => population.filter((food) => !vegOn || food.veg), [population, vegOn]);
  const filteredMean = selector && eligible.length ? selector.meanFor(eligible) : 0;

  const inventory = useMemo(
    () =>
      [...eligible].sort(
        (a, b) => a.rarity - b.rarity || a.price - b.price || a.name.localeCompare(b.name, 'vi'),
      ),
    [eligible],
  );

  const budgetOptions = useMemo(
    () => BUDGET_SLOTS.map((slot) => ({ value: slot, label: budgetLabel(kind, slot) })),
    [kind],
  );

  const columns = windowWidth >= 900 ? 6 : windowWidth >= 640 ? 4 : 3;

  const open = useCallback(() => {
    if (busy.current || !validTarget || !selector || !eligible.length || fitted == null) return;
    audio.current?.unlock();
    busy.current = true;

    const winner = selector.choose(eligible);
    const spinId = newId();
    const width = viewportWidth || windowWidth;
    const start = position.current;
    const center = Math.floor((width / 2 - start) / TILE_STEP);
    const profile = createSpinProfile(Math.random, reducedMotion);
    const landing = center + profile.tiles;
    const end = width / 2 - TILE_WIDTH * stopFraction() - landing * TILE_STEP;
    const rightEdge = Math.ceil((width - start) / TILE_STEP) + 1;
    const items = reel.filter(
      (item) => item.id >= center - Math.ceil(width / TILE_STEP) - 2 && item.id <= rightEdge,
    );
    const last = items.length ? Math.max(...items.map((item) => item.id)) : -1;
    const recent: Food[] = [];
    for (let id = last + 1; id <= landing + 4; id++) {
      const alternatives = eligible.filter(
        (food) => !recent.includes(food) && (selector.probabilities.get(food) ?? 0) > 0,
      );
      const food = id === landing ? winner : selector.choose(alternatives.length ? alternatives : eligible);
      items.push({ id, food });
      recent.push(food);
      if (recent.length > 8) recent.shift();
    }

    setReel(items);
    setSpinning(true);
    setMoving(true);
    setResult(null);
    audio.current?.play('csgo_ui_crate_open');

    const duration = profile.durationMs;
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
        if (shouldHaptic(soundRef.current, reducedRef.current)) haptic('tick');
        lastCell = cell;
      }
      if (progress < 1) {
        frame.current = requestAnimationFrame(animate);
        return;
      }
      void recordSpin({
        id: spinId,
        food: { name: winner.name, price: winner.price, image: winner.image, kind: winner.kind },
        settings: {
          budget: budget === 'custom' ? requested : fitted,
          budgetSlot: budget,
          kind,
          vegetarian: vegOn,
        },
      });
      busy.current = false;
      setSpinning(false);
      setMoving(false);
      setResult(winner);
      setRevealed(true);
      setSessionOpens((count) => count + 1);
      setRareStreak((streak) => nextRareStreak(streak, winner.rarity));
      audio.current?.play(REVEAL_SOUNDS[winner.rarity]);
      if (shouldHaptic(soundRef.current, reducedRef.current)) haptic('reveal', winner.rarity);
      if (shouldCelebrateGold(winner.rarity, reducedRef.current)) {
        setBurst((token) => token + 1);
        Animated.sequence([
          Animated.timing(shakeX, { toValue: 7, duration: 45, useNativeDriver: true }),
          Animated.timing(shakeX, { toValue: -7, duration: 45, useNativeDriver: true }),
          Animated.timing(shakeX, { toValue: 4, duration: 40, useNativeDriver: true }),
          Animated.timing(shakeX, { toValue: 0, duration: 40, useNativeDriver: true }),
        ]).start();
      }
    };
    frame.current = requestAnimationFrame(animate);
  }, [
    budget,
    eligible,
    fitted,
    kind,
    recordSpin,
    reducedMotion,
    reel,
    requested,
    selector,
    shakeX,
    translateX,
    validTarget,
    vegOn,
    viewportWidth,
    visibleStart,
    windowWidth,
  ]);

  useShakeToOpen(!reducedMotion && !spinning, open);

  const note =
    validTarget && fitted != null
      ? [
          `Tầm ${fitted}k · món quay ra có thể rẻ hoặc đắt hơn.`,
          vegOn && eligible.length
            ? `Giá trung bình trong danh sách: ${formatDong(Math.round(filteredMean))} / bữa`
            : null,
        ]
          .filter(Boolean)
          .join(' ')
      : null;

  const visibleTiles = reel.filter(({ id }) => id >= visibleStart && id < visibleStart + REEL_VISIBLE);

  const unlockKnife = () => setKnife(true);
  const onTitleTap = () => {
    const next = applyTitleTap(taps.current, Date.now());
    taps.current = next.state;
    if (next.unlocked) unlockKnife();
  };

  return (
    <View style={styles.bg}>
      <Image
        source={{ uri: WAREHOUSE_ART }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        pointerEvents="none"
      />
      <LinearGradient
        colors={['rgba(24,36,46,0.87)', 'rgba(37,50,61,0.85)']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <GoldBurst token={burst} />
      <Animated.View style={[styles.shell, { paddingTop: insets.top, transform: [{ translateX: shakeX }] }]}>
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
            <Pressable
              accessibilityRole="button"
              accessibilityHint="Chạm bảy lần hoặc nhấn giữ để mở case skin dao vàng"
              onPress={onTitleTap}
              onLongPress={unlockKnife}
              delayLongPress={700}
            >
              <Text style={styles.title}>{knife ? 'Mở hòm dao vàng' : 'Mở hòm ăn trưa'}</Text>
            </Pressable>
          </View>
          <Text
            style={styles.counter}
            accessibilityLabel="Lượt quay hoàn tất được ghi nhận trên website này"
          >
            Đã ghi nhận{' '}
            <Text style={styles.counterStrong}>
              {globalSpins === null ? '—' : new Intl.NumberFormat('vi-VN').format(globalSpins)}
            </Text>{' '}
            hòm
          </Text>
          <Text style={styles.stattrak} accessibilityLabel={`StatTrak ${sessionOpens} lượt trong phiên này`}>
            StatTrak™ {sessionOpens}
            {rareStreak >= 2 ? `  ·  chuỗi hiếm ×${rareStreak}` : ''}
          </Text>
          {knife ? <Text style={styles.knifeBanner}>★ {GOLDEN_KNIFE.name} · {GOLDEN_KNIFE.sub}</Text> : null}

          <View style={styles.chips}>
            {KINDS.map((item) => (
              <Pressable
                key={item.id}
                disabled={spinning}
                onPress={() => setKind(item.id)}
                style={[styles.chip, kind === item.id && styles.chipOn]}
              >
                <Text style={[styles.chipText, kind === item.id && styles.chipTextOn]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
          {kind === 'food' ? (
            <View style={styles.chips}>
              {MEAL_SEGMENTS.map((item) => (
                <Pressable
                  key={item.id}
                  disabled={spinning}
                  onPress={() => setSegment(item.id)}
                  style={[styles.chip, segment === item.id && styles.chipOn]}
                >
                  <Text style={[styles.chipText, segment === item.id && styles.chipTextOn]}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          {!eligible.length ? (
            <Text style={styles.empty}>
              Pool không có món phù hợp. Đổi buổi, tắt món chay, hoặc chọn loại khác.
            </Text>
          ) : null}

          <View style={styles.panel} onLayout={(e) => setViewportWidth(e.nativeEvent.layout.width)}>
            <View style={styles.reelWindow}>
              <View style={[styles.selector, knife && styles.selectorKnife]} pointerEvents="none" />
              <Animated.View style={[styles.track, { transform: [{ translateX }] }]}>
                {visibleTiles.map(({ food, id }) => (
                  <View key={id} style={[styles.slot, { left: id * TILE_STEP }]}>
                    <FoodCard food={food} mystery shine={!reducedMotion} />
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
                options={budgetOptions}
                disabled={spinning}
                valid={validTarget}
                note={note}
                error={`Nhập từ ${bounds.min} đến ${bounds.max} nghìn.`}
                onBudget={setBudget}
                onCustom={setCustom}
              />
              {kind === 'food' ? (
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
              ) : null}
            </View>
            <Pressable
              accessibilityRole="button"
              disabled={spinning || !validTarget || !eligible.length}
              onPress={open}
              style={(spinning || !validTarget) && styles.openDisabled}
            >
              <LinearGradient colors={[colors.buttonTop, colors.buttonBottom]} style={styles.open}>
                <Text style={styles.openText}>
                  {spinning ? 'ĐANG MỞ HÒM…' : result ? 'MỞ LẠI' : 'MỞ HÒM'}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>

          <View style={styles.inventory}>
            <Text style={styles.eyebrow}>TRONG HÒM CÓ GÌ?</Text>
            <Text style={styles.sectionTitle}>
              Các món trong hòm{' '}
              <Text style={styles.countBadge}>{eligible.length.toString().padStart(2, '0')}</Text>
            </Text>
            <View style={styles.grid}>
              {knife ? (
                <View style={[styles.knifeSlot, { width: `${100 / columns}%` }]}>
                  <View style={styles.knifeCard}>
                    <Text style={styles.knifeName}>★ {GOLDEN_KNIFE.name}</Text>
                    <Text style={styles.knifeSub}>{GOLDEN_KNIFE.sub}</Text>
                  </View>
                </View>
              ) : null}
              {inventory.map((food) => (
                <View key={foodKey(food)} style={{ width: `${100 / columns}%`, padding: 3.5 }}>
                  <FoodCard food={food} small />
                </View>
              ))}
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerBrand}>truanayangi.</Text>
            <View style={styles.footerLinks}>
              <Text style={styles.footerLink} onPress={() => void Linking.openURL('https://truanayangi.com/privacy.html')}>
                Quyền riêng tư
              </Text>
              <Text style={styles.footerLink} onPress={() => void Linking.openURL('https://truanayangi.com/terms.html')}>
                Điều khoản
              </Text>
              <Text
                style={styles.footerLink}
                onPress={() => void Linking.openURL('https://github.com/truanayangi-com/truanayangi')}
              >
                GitHub
              </Text>
            </View>
            <Text style={styles.footerNote}>Fan-made · SFX: Valve / SourceSounds</Text>
          </View>
        </ScrollView>
      </Animated.View>

      <WinnerModal
        food={result}
        visible={revealed}
        knife={knife}
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
    marginBottom: 4,
    color: '#abb8c2',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  counterStrong: {
    fontWeight: '500',
    color: colors.goldText,
    fontVariant: ['tabular-nums'],
  },
  stattrak: {
    textAlign: 'center',
    color: colors.gold,
    fontSize: 12,
    letterSpacing: 0.4,
    marginBottom: 8,
    fontVariant: ['tabular-nums'],
  },
  knifeBanner: {
    textAlign: 'center',
    color: colors.goldMystery,
    fontSize: 12,
    marginBottom: 10,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#ffffff30',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#17232c88',
  },
  chipOn: {
    borderColor: colors.gold,
    backgroundColor: '#3a3324',
  },
  chipText: {
    color: '#c5ccd1',
    fontSize: 13,
  },
  chipTextOn: {
    color: colors.goldText,
  },
  empty: {
    color: colors.invalid,
    marginBottom: 10,
    fontSize: 13,
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
  selectorKnife: {
    backgroundColor: '#ffe49a',
    shadowColor: '#ffe49a',
    shadowOpacity: 0.9,
    width: 4,
    marginLeft: -2,
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
  knifeSlot: {
    padding: 3.5,
  },
  knifeCard: {
    borderBottomWidth: 5,
    borderBottomColor: '#e4ae39',
    backgroundColor: '#231b0f',
    padding: 10,
    minHeight: 92,
    justifyContent: 'flex-end',
  },
  knifeName: {
    color: colors.goldMystery,
    fontSize: 13,
    fontWeight: '700',
  },
  knifeSub: {
    color: '#d9d0b4',
    fontSize: 11,
    marginTop: 4,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#ffffff20',
    marginTop: 35,
    paddingVertical: 24,
    gap: 8,
  },
  footerBrand: {
    fontSize: 12,
    color: colors.dim,
  },
  footerLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  footerLink: {
    fontSize: 12,
    color: colors.goldText,
  },
  footerNote: {
    fontSize: 12,
    color: colors.dim,
  },
});
