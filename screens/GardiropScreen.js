import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';

import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  deleteDoc,
} from 'firebase/firestore';

import { db, auth } from '../firebaseConfig';

const { width, height } = Dimensions.get('window');

const COLORS = {
  background: '#070A12',
  backgroundSoft: '#0B1020',

  card: 'rgba(255,255,255,0.08)',
  cardStrong: 'rgba(255,255,255,0.13)',
  sheet: '#0D1224',

  border: 'rgba(255,255,255,0.14)',
  borderStrong: 'rgba(255,255,255,0.22)',

  text: '#F8F7FF',
  textSoft: '#B9B4C8',
  textMuted: '#7F7895',

  accent: '#A78BFA',
  accentStrong: '#8B5CF6',
  accentSoft: '#C4B5FD',

  pinkGlow: '#EC4899',
  blueGlow: '#38BDF8',

  danger: '#FB7185',
  white: '#FFFFFF',
};

const FILTERLER = [
  { label: 'Tümü', value: 'all' },
  { label: 'Üst', value: 'top' },
  { label: 'Alt', value: 'bottom' },
  { label: 'Elbise', value: 'dress' },
  { label: 'Dış Giyim', value: 'outerwear' },
  { label: 'Ayakkabı', value: 'shoes' },
  { label: 'Çanta', value: 'bag' },
  { label: 'Aksesuar', value: 'accessory' },
];

const normalizeText = (value) => {
  return String(value || '')
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .trim();
};

const kategoriMetniOlustur = (item) => {
  const etiketler = item?.etiketler || {};

  return normalizeText(`
    ${item?.type || ''}
    ${item?.rol || ''}
    ${item?.kategori || ''}
    ${item?.anaKategori || ''}
    ${item?.category || ''}
    ${item?.altKategori || ''}
    ${item?.altTur || ''}
    ${etiketler?.altTur || ''}
    ${etiketler?.secilenAltTur || ''}
    ${etiketler?.renk || ''}
    ${etiketler?.desen || ''}
  `);
};

const kategoriKeyBul = (item) => {
  const type = normalizeText(item?.type || '');

  if (type === 'top') return 'top';
  if (type === 'bottom') return 'bottom';
  if (type === 'dress') return 'dress';
  if (type === 'outerwear') return 'outerwear';
  if (type === 'shoes') return 'shoes';
  if (type === 'bag') return 'bag';
  if (type === 'accessory') return 'accessory';

  const meta = kategoriMetniOlustur(item);

  if (
    meta.includes('elbise') ||
    meta.includes('tulum') ||
    meta.includes('dress') ||
    meta.includes('abiye')
  ) {
    return 'dress';
  }

  if (
    meta.includes('dis giyim') ||
    meta.includes('outerwear') ||
    meta.includes('ceket') ||
    meta.includes('blazer') ||
    meta.includes('mont') ||
    meta.includes('kaban') ||
    meta.includes('trenckot') ||
    meta.includes('yelek')
  ) {
    return 'outerwear';
  }

  if (
    meta.includes('ayakkabi') ||
    meta.includes('shoes') ||
    meta.includes('sneaker') ||
    meta.includes('bot') ||
    meta.includes('cizme') ||
    meta.includes('topuklu') ||
    meta.includes('babet') ||
    meta.includes('loafer') ||
    meta.includes('sandalet') ||
    meta.includes('terlik')
  ) {
    return 'shoes';
  }

  if (
    meta.includes('canta') ||
    meta.includes('bag') ||
    meta.includes('clutch') ||
    meta.includes('tote')
  ) {
    return 'bag';
  }

  if (
    meta.includes('aksesuar') ||
    meta.includes('accessory') ||
    meta.includes('sapka') ||
    meta.includes('gozluk') ||
    meta.includes('kemer') ||
    meta.includes('kolye') ||
    meta.includes('kupe') ||
    meta.includes('bileklik') ||
    meta.includes('saat') ||
    meta.includes('fular') ||
    meta.includes('atki')
  ) {
    return 'accessory';
  }

  if (
    meta.includes('alt') ||
    meta.includes('bottom') ||
    meta.includes('pantolon') ||
    meta.includes('kot') ||
    meta.includes('sort') ||
    meta.includes('etek') ||
    meta.includes('esofman') ||
    meta.includes('tayt')
  ) {
    return 'bottom';
  }

  if (
    meta.includes('ust') ||
    meta.includes('top') ||
    meta.includes('tisort') ||
    meta.includes('tshirt') ||
    meta.includes('gomlek') ||
    meta.includes('bluz') ||
    meta.includes('crop') ||
    meta.includes('kazak') ||
    meta.includes('sweatshirt') ||
    meta.includes('hirka') ||
    meta.includes('askili') ||
    meta.includes('body')
  ) {
    return 'top';
  }

  return 'other';
};

const kategoriAdiBul = (item) => {
  return item?.anaKategori || item?.kategori || item?.category || 'Parça';
};

const altKategoriAdiBul = (item) => {
  return (
    item?.altKategori ||
    item?.etiketler?.secilenAltTur ||
    item?.etiketler?.altTur ||
    item?.altTur ||
    'Kıyafet'
  );
};

const renkAdiBul = (item) => {
  return item?.renk || item?.etiketler?.renk || '';
};

export default function GardiropScreen({ navigation }) {
  const [kiyafetler, setKiyafetler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  const [aktifFiltre, setAktifFiltre] = useState('all');

  const [islemModaliGorunur, setIslemModaliGorunur] = useState(false);
  const [seciliKiyafet, setSeciliKiyafet] = useState(null);

  useEffect(() => {
    const user = auth.currentUser;

    if (!user) {
      setYukleniyor(false);
      return;
    }

    const q = query(
      collection(db, 'gardirop'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const liste = [];

        snapshot.forEach((docSnap) => {
          liste.push({
            id: String(docSnap.id).trim(),
            ...docSnap.data(),
          });
        });

        setKiyafetler(liste);
        setYukleniyor(false);
      },
      (error) => {
        console.log('Gardırop dinleme hatası:', error);
        setYukleniyor(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filtrelenmisKiyafetler = useMemo(() => {
    if (aktifFiltre === 'all') return kiyafetler;

    return kiyafetler.filter((item) => kategoriKeyBul(item) === aktifFiltre);
  }, [kiyafetler, aktifFiltre]);

  const kategoriSayilari = useMemo(() => {
    const sayilar = {
      all: kiyafetler.length,
      top: 0,
      bottom: 0,
      dress: 0,
      outerwear: 0,
      shoes: 0,
      bag: 0,
      accessory: 0,
    };

    kiyafetler.forEach((item) => {
      const key = kategoriKeyBul(item);

      if (sayilar[key] !== undefined) {
        sayilar[key] += 1;
      }
    });

    return sayilar;
  }, [kiyafetler]);

  const kiyafetSil = async (item) => {
    Alert.alert('Emin misin?', 'Bu parça gardıroptan silinecek.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'gardirop', item.id));
          } catch (e) {
            console.log('Kıyafet silme hatası:', e);
            Alert.alert('Hata', 'Parça silinirken bir sorun oluştu.');
          }
        },
      },
    ]);
  };

  const islemMenusuAc = (item) => {
    setSeciliKiyafet(item);
    setIslemModaliGorunur(true);
  };

  const gorselAramaParametreleriHazirla = (tip) => {
    if (!seciliKiyafet) return null;

    return {
      imageUrl: seciliKiyafet.imageUrl,
      tip,
      kategori: seciliKiyafet.kategori || '',
      anaKategori: seciliKiyafet.anaKategori || seciliKiyafet.kategori || '',
      altKategori: altKategoriAdiBul(seciliKiyafet),
      type: seciliKiyafet.type || kategoriKeyBul(seciliKiyafet),
      renk: renkAdiBul(seciliKiyafet),
    };
  };

  const renderFiltre = (filtre) => {
    const aktif = aktifFiltre === filtre.value;
    const sayi = kategoriSayilari[filtre.value] || 0;

    return (
      <TouchableOpacity
        key={filtre.value}
        activeOpacity={0.86}
        onPress={() => setAktifFiltre(filtre.value)}
        style={[
          styles.filterPill,
          aktif && styles.filterPillActive,
        ]}
      >
        <Text
          style={[
            styles.filterText,
            aktif && styles.filterTextActive,
          ]}
        >
          {filtre.label}
        </Text>

        <View
          style={[
            styles.filterCount,
            aktif && styles.filterCountActive,
          ]}
        >
          <Text
            style={[
              styles.filterCountText,
              aktif && styles.filterCountTextActive,
            ]}
          >
            {sayi}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderKiyafet = ({ item }) => {
    const anaKategori = kategoriAdiBul(item);
    const altKategori = altKategoriAdiBul(item);
    const renk = renkAdiBul(item);

    return (
      <View style={styles.cardWrapper}>
        <TouchableOpacity
          activeOpacity={0.9}
          onLongPress={() => islemMenusuAc(item)}
          style={styles.glassCard}
        >
          <View style={styles.cardGlowPurple} />
          <View style={styles.cardGlowBlue} />

          <View style={styles.cardTopRow}>
            <View style={styles.categoryChipSmall}>
              <Text style={styles.categoryChipText} numberOfLines={1}>
                {anaKategori}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.deleteIcon}
              onPress={() => kiyafetSil(item)}
            >
              <Feather name="trash-2" size={15} color={COLORS.danger} />
            </TouchableOpacity>
          </View>

          <Image
            source={{ uri: item.imageUrl }}
            style={styles.kiyafetImage}
            contentFit="contain"
          />

          <TouchableOpacity
            style={styles.aiBtn}
            onPress={() => islemMenusuAc(item)}
          >
            <Feather name="layers" size={14} color={COLORS.white} />
            <Text style={styles.aiBtnText}>Seçenekler</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        <Text style={styles.categoryLabel} numberOfLines={1}>
          {altKategori}
        </Text>

        {Boolean(renk) && (
          <Text style={styles.colorLabel} numberOfLines={1}>
            {renk}
          </Text>
        )}
      </View>
    );
  };

  const modalAnaKategori = seciliKiyafet ? kategoriAdiBul(seciliKiyafet) : '';
  const modalAltKategori = seciliKiyafet ? altKategoriAdiBul(seciliKiyafet) : '';
  const modalRenk = seciliKiyafet ? renkAdiBul(seciliKiyafet) : '';

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
      <View style={[styles.glow, styles.glowOne]} />
      <View style={[styles.glow, styles.glowTwo]} />
      <View style={[styles.glow, styles.glowThree]} />

      <View style={styles.header}>
        <View>
          <Text style={styles.overline}>AURA WARDROBE OS</Text>

          <Text style={styles.title}>Gardırobun</Text>

          <Text style={styles.headerText}>
            Akıllı stil arşivin hazır. Parçalarını kategoriye göre keşfet, ilham al ve stilini büyüt.
          </Text>
        </View>

        <View style={styles.countPill}>
          <Text style={styles.countNumber}>{kiyafetler.length}</Text>
          <Text style={styles.countText}>Parça</Text>
        </View>
      </View>

      <View style={styles.smartInfoCard}>
        <View style={styles.smartIconBox}>
          <Feather name="zap" size={18} color={COLORS.accentSoft} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.smartTitle}>Aura Lens hazır</Text>

          <Text style={styles.smartSubtitle}>
            Elbise, dış giyim, ayakkabı, çanta ve aksesuar parçalarını ayrı ayrı yönet.
          </Text>
        </View>
      </View>

      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FILTERLER.map(renderFiltre)}
        </ScrollView>
      </View>

      {yukleniyor ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.accentSoft} />
          <Text style={styles.loadingText}>Gardırobun hazırlanıyor...</Text>
        </View>
      ) : kiyafetler.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Feather name="shopping-bag" size={34} color={COLORS.accentSoft} />
          </View>

          <Text style={styles.emptyTitle}>Henüz parça yok</Text>

          <Text style={styles.emptyText}>
            İlk kıyafetini eklediğinde burada Aura gardırop görünümün oluşacak.
          </Text>
        </View>
      ) : filtrelenmisKiyafetler.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Feather name="filter" size={34} color={COLORS.accentSoft} />
          </View>

          <Text style={styles.emptyTitle}>Bu kategoride parça yok</Text>

          <Text style={styles.emptyText}>
            Fotoğraf Ekle ekranından bu kategoriye ait yeni bir parça ekleyebilirsin.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtrelenmisKiyafetler}
          keyExtractor={(item) => item.id}
          renderItem={renderKiyafet}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          extraData={aktifFiltre}
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={islemModaliGorunur}
        onRequestClose={() => setIslemModaliGorunur(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalBackdrop}
            onPress={() => setIslemModaliGorunur(false)}
          />

          <View style={styles.bottomSheet}>
            <View style={styles.dragIndicator} />

            <View style={styles.sheetHeader}>
              <View style={styles.sheetPreviewCard}>
                <View style={styles.sheetPreviewGlow} />

                {seciliKiyafet?.imageUrl ? (
                  <Image
                    source={{ uri: seciliKiyafet.imageUrl }}
                    style={styles.sheetPreviewImage}
                    contentFit="contain"
                  />
                ) : (
                  <Feather name="image" size={26} color={COLORS.accentSoft} />
                )}
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.sheetOverline}>AURA STYLE MENU</Text>

                <Text style={styles.sheetTitle}>Bu Parçayı Ne Yapalım?</Text>

                <Text style={styles.sheetSubtitle}>
                  {modalAnaKategori} · {modalAltKategori}
                  {modalRenk ? ` · ${modalRenk}` : ''}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.sheetCloseBtn}
                onPress={() => setIslemModaliGorunur(false)}
              >
                <Feather name="x" size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              activeOpacity={0.88}
              style={styles.actionButton}
              onPress={() => {
                setIslemModaliGorunur(false);

                if (seciliKiyafet) {
                  navigation.navigate(
                    'GorselArama',
                    gorselAramaParametreleriHazirla('benzer')
                  );
                }
              }}
            >
              <View style={styles.actionIconBox}>
                <Feather name="shopping-bag" size={22} color={COLORS.accentSoft} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.actionText}>Benzerlerini Gör</Text>

                <Text style={styles.actionSubtext}>
                  Nereden satın alabileceğini bul
                </Text>
              </View>

              <Feather name="chevron-right" size={22} color={COLORS.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.88}
              style={styles.actionButton}
              onPress={() => {
                setIslemModaliGorunur(false);

                if (seciliKiyafet) {
                  navigation.navigate(
                    'GorselArama',
                    gorselAramaParametreleriHazirla('ilham')
                  );
                }
              }}
            >
              <View style={styles.actionIconBox}>
                <Feather name="star" size={22} color={COLORS.accentSoft} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.actionText}>Nasıl Kombinlerim?</Text>

                <Text style={styles.actionSubtext}>
                  Bu parça + farklı parçalarla kombin ilhamlarını gör
                </Text>
              </View>

              <Feather name="chevron-right" size={22} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  glow: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.45,
  },

  glowOne: {
    width: 360,
    height: 360,
    top: -150,
    right: -140,
    backgroundColor: COLORS.accentStrong,
  },

  glowTwo: {
    width: 320,
    height: 320,
    bottom: -140,
    left: -140,
    backgroundColor: COLORS.pinkGlow,
    opacity: 0.26,
  },

  glowThree: {
    width: 260,
    height: 260,
    top: height * 0.32,
    left: -130,
    backgroundColor: COLORS.blueGlow,
    opacity: 0.14,
  },

  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  overline: {
    fontSize: 12,
    color: COLORS.accentSoft,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },

  title: {
    fontSize: 36,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -1.1,
  },

  headerText: {
    width: width * 0.62,
    marginTop: 7,
    color: COLORS.textSoft,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },

  countPill: {
    width: 74,
    height: 74,
    borderRadius: 28,
    backgroundColor: COLORS.cardStrong,
    borderWidth: 1.2,
    borderColor: COLORS.borderStrong,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.accentStrong,
    shadowOpacity: 0.35,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },

  countNumber: {
    fontSize: 24,
    color: COLORS.text,
    fontWeight: '900',
  },

  countText: {
    fontSize: 11,
    color: COLORS.accentSoft,
    fontWeight: '800',
  },

  smartInfoCard: {
    marginHorizontal: 24,
    marginBottom: 14,
    padding: 15,
    borderRadius: 26,
    backgroundColor: COLORS.card,
    borderWidth: 1.2,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: COLORS.accentStrong,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },

  smartIconBox: {
    width: 44,
    height: 44,
    borderRadius: 17,
    backgroundColor: 'rgba(167,139,250,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.24)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  smartTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.text,
  },

  smartSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: COLORS.textSoft,
    fontWeight: '600',
    lineHeight: 17,
  },

  filterSection: {
    marginBottom: 14,
  },

  filterScroll: {
    paddingHorizontal: 24,
    paddingRight: 40,
  },

  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 19,
    paddingVertical: 9,
    paddingHorizontal: 13,
    marginRight: 9,
  },

  filterPillActive: {
    backgroundColor: COLORS.accentStrong,
    borderColor: COLORS.accentSoft,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },

  filterText: {
    color: COLORS.textSoft,
    fontWeight: '900',
    fontSize: 12,
  },

  filterTextActive: {
    color: COLORS.white,
  },

  filterCount: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 7,
    paddingHorizontal: 5,
  },

  filterCountActive: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },

  filterCountText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '900',
  },

  filterCountTextActive: {
    color: COLORS.white,
  },

  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },

  listContent: {
    paddingBottom: 120,
    paddingTop: 2,
  },

  cardWrapper: {
    width: (width - 52) / 2,
    marginBottom: 24,
  },

  glassCard: {
    width: '100%',
    height: 222,
    backgroundColor: COLORS.card,
    borderRadius: 34,
    borderWidth: 1.2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: COLORS.accentStrong,
    shadowOpacity: 0.28,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 9,
  },

  cardGlowPurple: {
    position: 'absolute',
    width: 135,
    height: 135,
    borderRadius: 70,
    backgroundColor: COLORS.accentStrong,
    opacity: 0.2,
    top: 40,
  },

  cardGlowBlue: {
    position: 'absolute',
    width: 105,
    height: 105,
    borderRadius: 60,
    backgroundColor: COLORS.blueGlow,
    opacity: 0.08,
    bottom: 18,
    right: -20,
  },

  cardTopRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 5,
  },

  categoryChipSmall: {
    maxWidth: 96,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 13,
  },

  categoryChipText: {
    color: COLORS.accentSoft,
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  kiyafetImage: {
    width: '88%',
    height: '77%',
    zIndex: 2,
  },

  aiBtn: {
    position: 'absolute',
    bottom: 13,
    flexDirection: 'row',
    backgroundColor: COLORS.accentStrong,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 17,
    alignItems: 'center',
    shadowColor: COLORS.accent,
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 7 },
    elevation: 8,
    zIndex: 6,
  },

  aiBtnText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '900',
    marginLeft: 6,
    letterSpacing: 0.2,
  },

  deleteIcon: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: 8,
    borderRadius: 14,
  },

  categoryLabel: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.accentSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  colorLabel: {
    marginTop: 3,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 14,
    color: COLORS.textSoft,
    fontWeight: '700',
  },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 45,
  },

  emptyIcon: {
    width: 84,
    height: 84,
    borderRadius: 32,
    backgroundColor: 'rgba(167,139,250,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },

  emptyTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.text,
  },

  emptyText: {
    marginTop: 8,
    textAlign: 'center',
    color: COLORS.textSoft,
    lineHeight: 21,
    fontWeight: '600',
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.66)',
  },

  bottomSheet: {
    backgroundColor: COLORS.sheet,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 36,
    minHeight: height * 0.4,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.accentStrong,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.22,
    shadowRadius: 26,
    elevation: 26,
  },

  dragIndicator: {
    width: 48,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
  },

  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },

  sheetPreviewCard: {
    width: 70,
    height: 70,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    overflow: 'hidden',
  },

  sheetPreviewGlow: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.accentStrong,
    opacity: 0.22,
  },

  sheetPreviewImage: {
    width: '82%',
    height: '82%',
    zIndex: 2,
  },

  sheetOverline: {
    fontSize: 10,
    color: COLORS.accentSoft,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 3,
  },

  sheetTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: COLORS.text,
  },

  sheetSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.textSoft,
    fontWeight: '600',
    lineHeight: 17,
  },

  sheetCloseBtn: {
    width: 39,
    height: 39,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },

  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    padding: 16,
    borderRadius: 24,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  actionIconBox: {
    width: 50,
    height: 50,
    borderRadius: 19,
    backgroundColor: 'rgba(167,139,250,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  actionText: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.text,
  },

  actionSubtext: {
    fontSize: 13,
    color: COLORS.textSoft,
    marginTop: 3,
    fontWeight: '600',
  },
});