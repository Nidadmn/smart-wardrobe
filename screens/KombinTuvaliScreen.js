import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  PanResponder,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { Feather, FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  setDoc,
} from 'firebase/firestore';

import { db, auth } from '../firebaseConfig';
import { useNavigation, useRoute } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const COLORS = {
  background: '#070A12',
  backgroundSoft: '#0B1020',

  card: 'rgba(255,255,255,0.08)',
  cardStrong: 'rgba(255,255,255,0.13)',
  canvas: 'rgba(255,255,255,0.055)',

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

  gold: '#FFD76A',
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

const rolEtiketBul = (item) => {
  const key = kategoriKeyBul(item);

  if (key === 'top') return 'ÜST';
  if (key === 'bottom') return 'ALT';
  if (key === 'dress') return 'ELBİSE';
  if (key === 'outerwear') return 'DIŞ GİYİM';
  if (key === 'shoes') return 'AYAKKABI';
  if (key === 'bag') return 'ÇANTA';
  if (key === 'accessory') return 'AKSESUAR';

  return 'PARÇA';
};

const DraggableItem = ({ item, onRemove }) => {
  const pan = useRef(new Animated.ValueXY()).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value,
        });
      },

      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),

      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    })
  ).current;

  return (
    <Animated.View
      style={[pan.getLayout(), styles.dragBox]}
      {...panResponder.panHandlers}
    >
      <View style={styles.dragGlow} />

      <Image
        source={{ uri: item.imageUrl }}
        style={styles.canvasImg}
        contentFit="contain"
      />

      <View style={styles.canvasRoleLabel}>
        <Text style={styles.canvasRoleLabelText}>{rolEtiketBul(item)}</Text>
      </View>

      {item.isCapsule && (
        <View style={styles.jokerLabelTuval}>
          <FontAwesome name="star" size={10} color={COLORS.gold} />
          <Text style={styles.jokerLabelText}> Joker Parça</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.removeBtn}
        onPress={() => onRemove(item.instanceId)}
      >
        <Feather name="x-circle" size={22} color={COLORS.danger} />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function KombinTuvaliScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const secilenHedefTarih = route.params?.planlanacakTarih;

  const [aktifSekme, setAktifSekme] = useState('Tuval');
  const [aktifFiltre, setAktifFiltre] = useState('all');

  const [gardirop, setGardirop] = useState([]);
  const [tuvaldekiler, setTuvaldekiler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);

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

        setGardirop(liste);
        setYukleniyor(false);
      },
      (error) => {
        console.log('Tuval gardırop dinleme hatası:', error);
        setYukleniyor(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const kategoriSayilari = useMemo(() => {
    const sayilar = {
      all: gardirop.length,
      top: 0,
      bottom: 0,
      dress: 0,
      outerwear: 0,
      shoes: 0,
      bag: 0,
      accessory: 0,
    };

    gardirop.forEach((item) => {
      const key = kategoriKeyBul(item);

      if (sayilar[key] !== undefined) {
        sayilar[key] += 1;
      }
    });

    return sayilar;
  }, [gardirop]);

  const filtrelenmisGardirop = useMemo(() => {
    if (aktifFiltre === 'all') return gardirop;

    return gardirop.filter((item) => kategoriKeyBul(item) === aktifFiltre);
  }, [gardirop, aktifFiltre]);

  const kapsulParcalar = useMemo(() => {
    return gardirop.filter((p) => p.isCapsule);
  }, [gardirop]);

  const kapsulKombinSayisi = () => {
    const ustSayisi = kategoriSayilari.top || 0;
    const altSayisi = kategoriSayilari.bottom || 0;
    const elbiseSayisi = kategoriSayilari.dress || 0;

    const anaPotansiyel = ustSayisi * altSayisi + elbiseSayisi;

    const disCarpan = Math.max(1, (kategoriSayilari.outerwear || 0) + 1);
    const ayakkabiCarpan = Math.max(1, (kategoriSayilari.shoes || 0) + 1);
    const cantaCarpan = Math.max(1, (kategoriSayilari.bag || 0) + 1);
    const aksesuarCarpan = Math.max(1, (kategoriSayilari.accessory || 0) + 1);

    return anaPotansiyel * disCarpan * ayakkabiCarpan * cantaCarpan * aksesuarCarpan;
  };

  const kombinArtisi = () => {
    if (tuvaldekiler.length === 0) return 0;

    const potansiyel = kapsulKombinSayisi();
    const seciliCarpan = Math.max(1, tuvaldekiler.length);

    return Math.max(0, Math.round(potansiyel / seciliCarpan));
  };

  const tuvaleEkle = (item) => {
    if (tuvaldekiler.length >= 6) {
      Alert.alert(
        'Limit Doldu',
        'Tuval üzerinde maksimum 6 parça kullanabilirsin.'
      );
      return;
    }

    setTuvaldekiler([
      ...tuvaldekiler,
      {
        ...item,
        instanceId: Date.now() + Math.random(),
      },
    ]);
  };

  const jokerYap = async (id, currentStatus) => {
    try {
      const itemRef = doc(db, 'gardirop', id);

      await updateDoc(itemRef, {
        isCapsule: !currentStatus,
      });

      setGardirop((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                isCapsule: !currentStatus,
              }
            : p
        )
      );
    } catch (e) {
      console.log('Joker güncelleme hatası:', e);
    }
  };

  const kombiniTakvimeKaydet = async () => {
    if (tuvaldekiler.length === 0) {
      Alert.alert(
        'Eksik İşlem',
        'Önce tuvale birkaç kıyafet eklemelisin.'
      );
      return;
    }

    try {
      let kayitTarihi = secilenHedefTarih;

      if (!kayitTarihi) {
        const bugun = new Date();

        const yil = bugun.getFullYear();
        const ay = String(bugun.getMonth() + 1).padStart(2, '0');
        const gun = String(bugun.getDate()).padStart(2, '0');

        kayitTarihi = `${yil}-${ay}-${gun}`;
      }

      const kombinData = {
        tarih: kayitTarihi,

        kombinParcalari: tuvaldekiler.map((p) => ({
          id: p.id,
          imageUrl: p.imageUrl,
          kategori: p.kategori || p.anaKategori || '',
          anaKategori: p.anaKategori || p.kategori || '',
          altKategori: p.altKategori || p.etiketler?.secilenAltTur || p.etiketler?.altTur || '',
          type: p.type || kategoriKeyBul(p),
          rol: p.rol || rolEtiketBul(p).toLowerCase(),
          renk: p.renk || p.etiketler?.renk || '',
          isCapsule: p.isCapsule || false,
        })),

        puan: 0,
      };

      await setDoc(
        doc(db, 'kombin_planlayici', `${kayitTarihi}_kombin`),
        kombinData
      );

      Alert.alert(
        'Başarılı',
        `${kayitTarihi} tarihine kombin planlandı.`,
        [
          {
            text: 'Takvime Git',
            onPress: () => navigation.navigate('Takvim'),
          },
        ]
      );

      setTuvaldekiler([]);
    } catch (e) {
      console.log('Kombin kaydetme hatası:', e);

      Alert.alert(
        'Hata',
        'Kombin kaydedilirken bir sorun oluştu.'
      );
    }
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

  const renderAltPanelItem = (item) => {
    const altKategori = altKategoriAdiBul(item);
    const renk = renkAdiBul(item);

    return (
      <View key={item.id} style={styles.cardContainer}>
        <TouchableOpacity
          style={[
            styles.itemCard,
            item.isCapsule && styles.jokerBorder,
          ]}
          activeOpacity={0.86}
          onPress={() => tuvaleEkle(item)}
          onLongPress={() =>
            jokerYap(item.id, item.isCapsule)
          }
        >
          <View style={styles.itemCardGlow} />

          <Image
            source={{ uri: item.imageUrl }}
            style={styles.cardImg}
            contentFit="contain"
          />

          <View style={styles.itemTypeBadge}>
            <Text style={styles.itemTypeBadgeText}>{rolEtiketBul(item)}</Text>
          </View>

          {item.isCapsule && (
            <View style={styles.starMini}>
              <FontAwesome
                name="star"
                size={10}
                color={COLORS.gold}
              />
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.itemMiniTitle} numberOfLines={1}>
          {altKategori}
        </Text>

        {Boolean(renk) && (
          <Text style={styles.itemMiniColor} numberOfLines={1}>
            {renk}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.glow, styles.glowOne]} />
      <View style={[styles.glow, styles.glowTwo]} />
      <View style={[styles.glow, styles.glowThree]} />

      <View style={styles.header}>
        <Text style={styles.overline}>AURA STUDIO</Text>

        <Text style={styles.pageTitle}>Kombin Tuvali</Text>

        <Text style={styles.pageSubtitle}>
          Elbise, dış giyim, ayakkabı, çanta ve aksesuarları sürükleyerek kombinlerini stüdyo alanında dene.
        </Text>
      </View>

      <View style={styles.tabsWrapper}>
        {[
          { key: 'Tuval', label: 'Kombin Tuvali' },
          { key: 'Kapsül', label: 'Kapsül' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setAktifSekme(tab.key)}
            activeOpacity={0.85}
            style={[
              styles.tab,
              aktifSekme === tab.key && styles.tabActive,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                aktifSekme === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.contentArea}>
        {aktifSekme === 'Tuval' ? (
          <View style={{ flex: 1 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.analyticsScroll}
              contentContainerStyle={styles.analyticsScrollContent}
            >
              <View style={styles.analyticsCard}>
                <View style={styles.analyticsIconBox}>
                  <Feather name="zap" size={21} color={COLORS.accentSoft} />
                </View>

                <Text style={styles.analyticsValue}>
                  +{kombinArtisi()}
                </Text>

                <Text style={styles.analyticsLabel}>
                  Potansiyel Kombin
                </Text>
              </View>

              <View style={styles.analyticsCard}>
                <View style={styles.analyticsIconBox}>
                  <FontAwesome
                    name="star"
                    size={21}
                    color={COLORS.gold}
                  />
                </View>

                <Text style={styles.analyticsValue}>
                  {kapsulParcalar.length}
                </Text>

                <Text style={styles.analyticsLabel}>
                  Joker Parça
                </Text>
              </View>

              <View style={styles.analyticsCard}>
                <View style={styles.analyticsIconBox}>
                  <MaterialIcons
                    name="auto-awesome"
                    size={22}
                    color={COLORS.pinkGlow}
                  />
                </View>

                <Text style={styles.analyticsValue}>
                  {kapsulKombinSayisi()}
                </Text>

                <Text style={styles.analyticsLabel}>
                  Teorik Kombin
                </Text>
              </View>
            </ScrollView>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.canvasScroll}
              contentContainerStyle={styles.canvasScrollContent}
            >
              <View style={styles.studioInfoCard}>
                <View style={styles.studioIconBox}>
                  <Feather name="move" size={18} color={COLORS.accentSoft} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.studioInfoTitle}>Aura Deneme Stüdyosu</Text>

                  <Text style={styles.studioInfoText}>
                    Aşağıdaki geniş alanda parçaları sürükleyerek üst üste, yan yana veya katmanlı şekilde deneyebilirsin.
                  </Text>
                </View>
              </View>

              <View style={styles.glassCanvas}>
                <View style={styles.canvasGlowPurple} />
                <View style={styles.canvasGlowBlue} />

                {tuvaldekiler.length === 0 ? (
                  <View style={styles.emptyCanvas}>
                    <View style={styles.emptyIconRing}>
                      <Feather
                        name="layers"
                        size={42}
                        color={COLORS.accentSoft}
                      />
                    </View>

                    <Text style={styles.emptyTitle}>
                      Kombin Deneme Alanı
                    </Text>

                    <Text style={styles.emptyText}>
                      Alt panelden parçalara dokun. Parçalar burada belirecek;
                      sonra sürükleyerek kombinini dene.
                    </Text>
                  </View>
                ) : (
                  tuvaldekiler.map((p) => (
                    <DraggableItem
                      key={p.instanceId}
                      item={p}
                      onRemove={(id) =>
                        setTuvaldekiler((prev) =>
                          prev.filter((x) => x.instanceId !== id)
                        )
                      }
                    />
                  ))
                )}
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.clearBtn}
                  activeOpacity={0.85}
                  onPress={() => setTuvaldekiler([])}
                >
                  <Feather
                    name="trash-2"
                    size={16}
                    color={COLORS.textSoft}
                  />

                  <Text style={styles.clearBtnText}>
                    Temizle
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveBtn}
                  activeOpacity={0.88}
                  onPress={kombiniTakvimeKaydet}
                >
                  <Feather
                    name="save"
                    size={18}
                    color={COLORS.white}
                  />

                  <Text style={styles.saveBtnText}>
                    Takvime Kaydet
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.scrollHintCard}>
                <Feather name="arrow-down" size={16} color={COLORS.accentSoft} />

                <Text style={styles.scrollHintText}>
                  Tuval alanı aşağı kaydırılabilir. Daha fazla boşlukta parçaları rahatça deneyebilirsin.
                </Text>
              </View>
            </ScrollView>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 130 }}
          >
            <View style={styles.capsuleHero}>
              <View style={styles.heroGlow} />

              <View style={styles.capsuleHeroRow}>
                <View style={styles.capsuleIconBox}>
                  <FontAwesome
                    name="star"
                    size={23}
                    color={COLORS.gold}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.capsuleHeroTitle}>
                    Kapsül Dolap Sistemi
                  </Text>

                  <Text style={styles.capsuleHeroText}>
                    Az ama birbiriyle uyumlu parçalarla daha çok kombin üret.
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>
                Aura bunu nasıl hesaplıyor?
              </Text>

              <Text style={styles.infoText}>
                Sistem, joker parçaların diğer kıyafetlerle olan eşleşme
                potansiyelini analiz eder.
              </Text>

              <Text style={styles.infoText}>
                Her joker parça; renk, kategori ve stil uyumuna göre daha fazla
                kombin üretme kapasitesine sahiptir.
              </Text>
            </View>

            <Text style={styles.sectionTitle}>
              Joker Parçaların
            </Text>

            {kapsulParcalar.length === 0 ? (
              <View style={styles.emptyCapsuleBox}>
                <Feather name="star" size={28} color={COLORS.accentSoft} />

                <Text style={styles.emptyCapsuleText}>
                  Henüz joker parça seçmedin.
                </Text>

                <Text style={styles.emptyCapsuleSubText}>
                  Alt panelde bir parçaya uzun basarak joker olarak işaretleyebilirsin.
                </Text>
              </View>
            ) : (
              <View style={styles.capsuleGrid}>
                {kapsulParcalar.map((item) => (
                  <View
                    key={item.id}
                    style={styles.capsuleCard}
                  >
                    <View style={styles.capsuleGlow} />

                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.capsuleImg}
                      contentFit="contain"
                    />

                    <Text style={styles.capsuleCategory} numberOfLines={1}>
                      {altKategoriAdiBul(item)}
                    </Text>

                    <Text style={styles.capsuleRole} numberOfLines={1}>
                      {rolEtiketBul(item)}
                    </Text>

                    <TouchableOpacity
                      style={styles.removeCapsuleBtn}
                      onPress={() =>
                        jokerYap(item.id, item.isCapsule)
                      }
                    >
                      <Text
                        style={styles.removeCapsuleBtnText}
                      >
                        Joker Kaldır
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </View>

      <View style={styles.bottomPanel}>
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelOverline}>AURA WARDROBE SOURCE</Text>

            <Text style={styles.panelTitle}>
              Gardırobun
            </Text>
          </View>

          <Text style={styles.panelSubtitle}>
            Dokun ekle · Uzun bas joker
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FILTERLER.map(renderFiltre)}
        </ScrollView>

        {yukleniyor ? (
          <ActivityIndicator color={COLORS.accentSoft} />
        ) : filtrelenmisGardirop.length === 0 ? (
          <View style={styles.emptyPanelState}>
            <Text style={styles.emptyPanelText}>
              Bu kategoride parça yok.
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {filtrelenmisGardirop.map(renderAltPanelItem)}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 50,
  },

  glow: {
    position: 'absolute',
    borderRadius: 999,
  },

  glowOne: {
    width: 360,
    height: 360,
    top: -150,
    left: -140,
    backgroundColor: COLORS.accentStrong,
    opacity: 0.38,
  },

  glowTwo: {
    width: 330,
    height: 330,
    bottom: -120,
    right: -140,
    backgroundColor: COLORS.pinkGlow,
    opacity: 0.22,
  },

  glowThree: {
    width: 250,
    height: 250,
    top: height * 0.34,
    right: -130,
    backgroundColor: COLORS.blueGlow,
    opacity: 0.13,
  },

  header: {
    paddingHorizontal: 24,
    marginBottom: 14,
  },

  overline: {
    fontSize: 12,
    color: COLORS.accentSoft,
    fontWeight: '900',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 4,
  },

  pageTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -1.1,
  },

  pageSubtitle: {
    marginTop: 6,
    color: COLORS.textSoft,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },

  tabsWrapper: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 5,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 18,
  },

  tabActive: {
    backgroundColor: COLORS.accentStrong,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 7,
  },

  tabText: {
    color: COLORS.textMuted,
    fontWeight: '800',
  },

  tabTextActive: {
    color: COLORS.white,
    fontWeight: '900',
  },

  contentArea: {
    flex: 1,
    paddingHorizontal: 20,
    marginBottom: 260,
  },

  analyticsScroll: {
    maxHeight: 122,
    marginBottom: 12,
  },

  analyticsScrollContent: {
    paddingRight: 18,
  },

  analyticsCard: {
    width: 132,
    backgroundColor: COLORS.card,
    borderRadius: 26,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.accentStrong,
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },

  analyticsIconBox: {
    width: 38,
    height: 38,
    borderRadius: 15,
    backgroundColor: 'rgba(167,139,250,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  analyticsValue: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.text,
    marginTop: 8,
  },

  analyticsLabel: {
    marginTop: 4,
    color: COLORS.textSoft,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '700',
  },

  canvasScroll: {
    flex: 1,
  },

  canvasScrollContent: {
    paddingBottom: 26,
  },

  studioInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 26,
    padding: 15,
    marginBottom: 14,
  },

  studioIconBox: {
    width: 44,
    height: 44,
    borderRadius: 17,
    backgroundColor: 'rgba(167,139,250,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  studioInfoTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '900',
  },

  studioInfoText: {
    color: COLORS.textSoft,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    marginTop: 3,
  },

  glassCanvas: {
    width: '100%',
    height: 760,
    backgroundColor: COLORS.canvas,
    borderRadius: 36,
    borderWidth: 1.2,
    borderColor: COLORS.border,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: COLORS.accentStrong,
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },

  canvasGlowPurple: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: COLORS.accentStrong,
    opacity: 0.14,
    top: 80,
    left: 40,
  },

  canvasGlowBlue: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: COLORS.blueGlow,
    opacity: 0.08,
    bottom: 110,
    right: -60,
  },

  emptyCanvas: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },

  emptyIconRing: {
    width: 88,
    height: 88,
    borderRadius: 34,
    backgroundColor: 'rgba(167,139,250,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyTitle: {
    marginTop: 18,
    fontSize: 23,
    fontWeight: '900',
    color: COLORS.text,
  },

  emptyText: {
    textAlign: 'center',
    marginTop: 9,
    color: COLORS.textSoft,
    lineHeight: 22,
    fontWeight: '600',
  },

  dragBox: {
    position: 'absolute',
    width: 145,
    height: 145,
  },

  dragGlow: {
    position: 'absolute',
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: COLORS.accentStrong,
    opacity: 0.15,
    top: 18,
    left: 16,
  },

  canvasImg: {
    width: '100%',
    height: '100%',
    zIndex: 2,
  },

  canvasRoleLabel: {
    position: 'absolute',
    top: -3,
    left: 8,
    backgroundColor: 'rgba(13,18,36,0.92)',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 11,
    zIndex: 4,
  },

  canvasRoleLabelText: {
    color: COLORS.accentSoft,
    fontSize: 9,
    fontWeight: '900',
  },

  removeBtn: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    zIndex: 4,
  },

  jokerLabelTuval: {
    position: 'absolute',
    bottom: -4,
    left: 8,
    backgroundColor: 'rgba(13,18,36,0.92)',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 4,
  },

  jokerLabelText: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: '900',
  },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },

  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 20,
    height: 54,
    borderRadius: 19,
  },

  clearBtnText: {
    marginLeft: 8,
    color: COLORS.textSoft,
    fontWeight: '900',
  },

  saveBtn: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: COLORS.accentStrong,
    borderRadius: 19,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    shadowColor: COLORS.accent,
    shadowOpacity: 0.42,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },

  saveBtnText: {
    color: COLORS.white,
    fontWeight: '900',
    marginLeft: 8,
  },

  scrollHintCard: {
    marginTop: 14,
    backgroundColor: 'rgba(167,139,250,0.11)',
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.2)',
    borderRadius: 22,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },

  scrollHintText: {
    flex: 1,
    marginLeft: 10,
    color: COLORS.textSoft,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
  },

  capsuleHero: {
    backgroundColor: COLORS.card,
    borderRadius: 30,
    padding: 22,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },

  heroGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: COLORS.accentStrong,
    opacity: 0.13,
    right: -50,
    top: -40,
  },

  capsuleHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  capsuleIconBox: {
    width: 52,
    height: 52,
    borderRadius: 20,
    backgroundColor: 'rgba(255,215,106,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,106,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },

  capsuleHeroTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: COLORS.text,
  },

  capsuleHeroText: {
    color: COLORS.textSoft,
    lineHeight: 20,
    fontWeight: '600',
    marginTop: 4,
  },

  infoBox: {
    backgroundColor: COLORS.card,
    borderRadius: 26,
    padding: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  infoTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 10,
  },

  infoText: {
    color: COLORS.textSoft,
    lineHeight: 22,
    marginBottom: 10,
    fontWeight: '600',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 15,
  },

  capsuleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  capsuleCard: {
    width: (width - 55) / 2,
    backgroundColor: COLORS.card,
    borderRadius: 26,
    padding: 16,
    marginBottom: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },

  capsuleGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.accentStrong,
    opacity: 0.12,
    top: 30,
  },

  capsuleImg: {
    width: 100,
    height: 120,
    zIndex: 2,
  },

  capsuleCategory: {
    marginTop: 10,
    fontWeight: '900',
    color: COLORS.text,
    textAlign: 'center',
  },

  capsuleRole: {
    marginTop: 3,
    fontWeight: '800',
    color: COLORS.textMuted,
    fontSize: 10,
  },

  removeCapsuleBtn: {
    marginTop: 12,
    backgroundColor: 'rgba(167,139,250,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.22)',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 15,
  },

  removeCapsuleBtnText: {
    color: COLORS.accentSoft,
    fontWeight: '900',
    fontSize: 12,
  },

  emptyCapsuleBox: {
    backgroundColor: COLORS.card,
    borderRadius: 26,
    padding: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  emptyCapsuleText: {
    color: COLORS.text,
    fontWeight: '900',
    marginTop: 10,
  },

  emptyCapsuleSubText: {
    color: COLORS.textSoft,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 19,
  },

  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 260,
    backgroundColor: COLORS.backgroundSoft,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 20,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.accentStrong,
    shadowOpacity: 0.26,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: -10 },
    elevation: 24,
  },

  panelHeader: {
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },

  panelOverline: {
    color: COLORS.accentSoft,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.1,
  },

  panelTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: COLORS.text,
    marginTop: 2,
  },

  panelSubtitle: {
    color: COLORS.textMuted,
    fontWeight: '700',
    fontSize: 11,
  },

  filterScroll: {
    paddingRight: 36,
    marginBottom: 12,
  },

  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },

  filterPillActive: {
    backgroundColor: COLORS.accentStrong,
    borderColor: COLORS.accentSoft,
  },

  filterText: {
    color: COLORS.textSoft,
    fontWeight: '900',
    fontSize: 11,
  },

  filterTextActive: {
    color: COLORS.white,
  },

  filterCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    paddingHorizontal: 5,
  },

  filterCountActive: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },

  filterCountText: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '900',
  },

  filterCountTextActive: {
    color: COLORS.white,
  },

  scrollContent: {
    paddingRight: 40,
  },

  cardContainer: {
    width: 94,
    marginRight: 16,
  },

  itemCard: {
    width: 94,
    height: 112,
    backgroundColor: COLORS.card,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },

  itemCardGlow: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.accentStrong,
    opacity: 0.13,
  },

  jokerBorder: {
    borderWidth: 2,
    borderColor: COLORS.gold,
  },

  cardImg: {
    width: '86%',
    height: '86%',
    zIndex: 2,
  },

  itemTypeBadge: {
    position: 'absolute',
    top: 7,
    left: 7,
    backgroundColor: 'rgba(13,18,36,0.9)',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 9,
    zIndex: 3,
  },

  itemTypeBadgeText: {
    color: COLORS.accentSoft,
    fontSize: 7,
    fontWeight: '900',
  },

  itemMiniTitle: {
    color: COLORS.textSoft,
    fontSize: 10,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 6,
  },

  itemMiniColor: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 2,
  },

  starMini: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(13,18,36,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,106,0.35)',
    width: 21,
    height: 21,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },

  emptyPanelState: {
    height: 116,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyPanelText: {
    color: COLORS.textMuted,
    fontWeight: '800',
  },
});