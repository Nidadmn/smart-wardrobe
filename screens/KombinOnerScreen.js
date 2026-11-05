import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  FlatList,
  Alert,
} from 'react-native';

import { Image } from 'expo-image';
import {
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';

import { db, auth } from '../firebaseConfig';
import { yapayZekadanKombinIste } from '../services/aiDanisman';

const { width } = Dimensions.get('window');

const COLORS = {
  background: '#070A12',
  card: 'rgba(255,255,255,0.08)',
  canvas: 'rgba(255,255,255,0.055)',
  border: 'rgba(255,255,255,0.14)',
  text: '#F8F7FF',
  textSoft: '#B9B4C8',
  textMuted: '#7F7895',
  accent: '#A78BFA',
  accentStrong: '#8B5CF6',
  accentSoft: '#C4B5FD',
  pinkGlow: '#EC4899',
  blueGlow: '#38BDF8',
  white: '#FFFFFF',
  danger: '#FB7185',
};

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
    ${item?.stil || ''}
    ${item?.style || ''}
    ${etiketler?.altTur || ''}
    ${etiketler?.secilenAltTur || ''}
    ${etiketler?.renk || ''}
    ${etiketler?.materyal || ''}
    ${etiketler?.desen || ''}
  `);
};

const itemType = (item) => normalizeText(item?.type || '');

const isUstParca = (item) => {
  if (itemType(item) === 'top') return true;
  if (['outerwear', 'dress', 'shoes', 'bag', 'accessory'].includes(itemType(item))) return false;

  const meta = kategoriMetniOlustur(item);

  return (
    meta.includes('ust') ||
    meta.includes('top') ||
    meta.includes('ust giyim') ||
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
  );
};

const isAltParca = (item) => {
  if (itemType(item) === 'bottom') return true;
  if (['outerwear', 'dress', 'shoes', 'bag', 'accessory'].includes(itemType(item))) return false;

  const meta = kategoriMetniOlustur(item);

  return (
    meta.includes('alt') ||
    meta.includes('bottom') ||
    meta.includes('alt giyim') ||
    meta.includes('pantolon') ||
    meta.includes('kot') ||
    meta.includes('sort') ||
    meta.includes('etek') ||
    meta.includes('esofman') ||
    meta.includes('tayt')
  );
};

const isElbiseParca = (item) => {
  if (itemType(item) === 'dress') return true;

  const meta = kategoriMetniOlustur(item);

  return (
    meta.includes('elbise') ||
    meta.includes('tulum') ||
    meta.includes('dress') ||
    meta.includes('abiye')
  );
};

const isDisGiyimParca = (item) => {
  if (itemType(item) === 'outerwear') return true;

  const meta = kategoriMetniOlustur(item);

  return (
    meta.includes('dis giyim') ||
    meta.includes('outerwear') ||
    meta.includes('ceket') ||
    meta.includes('blazer') ||
    meta.includes('mont') ||
    meta.includes('kaban') ||
    meta.includes('trenckot') ||
    meta.includes('deri ceket') ||
    meta.includes('yelek')
  );
};

const isAyakkabiParca = (item) => {
  if (itemType(item) === 'shoes') return true;

  const meta = kategoriMetniOlustur(item);

  return (
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
  );
};

const isCantaParca = (item) => {
  if (itemType(item) === 'bag') return true;

  const meta = kategoriMetniOlustur(item);

  return (
    meta.includes('canta') ||
    meta.includes('bag') ||
    meta.includes('clutch') ||
    meta.includes('tote')
  );
};

const isAksesuarParca = (item) => {
  if (itemType(item) === 'accessory') return true;

  const meta = kategoriMetniOlustur(item);

  return (
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
  );
};

const rolEtiketBul = (rol) => {
  const temizRol = normalizeText(rol);

  if (temizRol.includes('ust')) return 'ÜST';
  if (temizRol.includes('alt')) return 'ALT';
  if (temizRol.includes('elbise')) return 'ELBİSE';
  if (temizRol.includes('dis')) return 'DIŞ GİYİM';
  if (temizRol.includes('ayakkabi')) return 'AYAKKABI';
  if (temizRol.includes('canta')) return 'ÇANTA';
  if (temizRol.includes('aksesuar')) return 'AKSESUAR';

  return String(rol || 'PARÇA').toUpperCase();
};

export default function KombinOnerScreen() {
  const [tumKiyafetler, setTumKiyafetler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [aiYukleniyor, setAiYukleniyor] = useState(false);
  const [aiKombinler, setAiKombinler] = useState([]);
  const [analizRunId, setAnalizRunId] = useState(Date.now());

  const flatListRef = useRef(null);

  useEffect(() => {
    const user = auth.currentUser;

    if (!user) {
      setYukleniyor(false);
      setTumKiyafetler([]);
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
          const data = docSnap.data();

          liste.push({
            id: String(docSnap.id).trim(),
            ...data,
          });
        });

        setTumKiyafetler(liste);

        // Dolap değişirse eski analiz sonucu artık geçerli sayılmasın.
        setAiKombinler([]);
        setAnalizRunId(Date.now());
        setYukleniyor(false);
      },
      (error) => {
        console.log('Kombin ekranı gardırop dinleme hatası:', error);
        setYukleniyor(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const ustParcalar = useMemo(() => {
    return tumKiyafetler.filter((item) => isUstParca(item));
  }, [tumKiyafetler]);

  const altParcalar = useMemo(() => {
    return tumKiyafetler.filter((item) => isAltParca(item));
  }, [tumKiyafetler]);

  const elbiseParcalar = useMemo(() => {
    return tumKiyafetler.filter((item) => isElbiseParca(item));
  }, [tumKiyafetler]);

  const disGiyimParcalar = useMemo(() => {
    return tumKiyafetler.filter((item) => isDisGiyimParca(item));
  }, [tumKiyafetler]);

  const ayakkabiParcalar = useMemo(() => {
    return tumKiyafetler.filter((item) => isAyakkabiParca(item));
  }, [tumKiyafetler]);

  const cantaParcalar = useMemo(() => {
    return tumKiyafetler.filter((item) => isCantaParca(item));
  }, [tumKiyafetler]);

  const aksesuarParcalar = useMemo(() => {
    return tumKiyafetler.filter((item) => isAksesuarParca(item));
  }, [tumKiyafetler]);

  const anaKiyafetSayisi =
    ustParcalar.length + altParcalar.length + elbiseParcalar.length + disGiyimParcalar.length;

  const tamamlayiciSayisi =
    ayakkabiParcalar.length + cantaParcalar.length + aksesuarParcalar.length;

  const kombinAnaliziMumkunMu =
    (ustParcalar.length > 0 && altParcalar.length > 0) ||
    elbiseParcalar.length > 0;

  const kombinPotansiyeli = useMemo(() => {
    const ustAltPotansiyel = ustParcalar.length * altParcalar.length;
    const elbisePotansiyel = elbiseParcalar.length;

    const anaPotansiyel = ustAltPotansiyel + elbisePotansiyel;

    const disCarpan = Math.max(1, disGiyimParcalar.length + 1);
    const ayakkabiCarpan = Math.max(1, ayakkabiParcalar.length + 1);
    const cantaCarpan = Math.max(1, cantaParcalar.length + 1);
    const aksesuarCarpan = Math.max(1, aksesuarParcalar.length + 1);

    return anaPotansiyel * disCarpan * ayakkabiCarpan * cantaCarpan * aksesuarCarpan;
  }, [
    ustParcalar.length,
    altParcalar.length,
    elbiseParcalar.length,
    disGiyimParcalar.length,
    ayakkabiParcalar.length,
    cantaParcalar.length,
    aksesuarParcalar.length,
  ]);

  const kiyafetBul = (id) => {
    if (!id) return null;

    return (
      tumKiyafetler.find(
        (k) => String(k.id).trim() === String(id).trim()
      ) || null
    );
  };

  const resimBul = (id) => {
    const parca = kiyafetBul(id);
    return parca?.imageUrl || null;
  };

  const parcaAdiBul = (id) => {
    const parca = kiyafetBul(id);

    if (!parca) return 'Parça';

    return (
      parca?.etiketler?.secilenAltTur ||
      parca?.altKategori ||
      parca?.etiketler?.altTur ||
      parca?.kategori ||
      parca?.anaKategori ||
      'Parça'
    );
  };

  const parcaRenkBul = (id) => {
    const parca = kiyafetBul(id);

    if (!parca) return '';

    return (
      parca?.renk ||
      parca?.etiketler?.renk ||
      ''
    );
  };

  const kombinParcalariniHazirla = (item) => {
    if (Array.isArray(item?.parcalar) && item.parcalar.length > 0) {
      return item.parcalar.map((parca) => ({
        rol: parca.rol || 'parça',
        id: parca.id,
      }));
    }

    const eskiParcalar = [];

    if (item?.elbiseId) eskiParcalar.push({ rol: 'elbise', id: item.elbiseId });
    if (item?.ustId && item?.ustId !== item?.elbiseId) eskiParcalar.push({ rol: 'üst', id: item.ustId });
    if (item?.altId && item?.altId !== item?.ustId) eskiParcalar.push({ rol: 'alt', id: item.altId });
    if (item?.disGiyimId) eskiParcalar.push({ rol: 'dış giyim', id: item.disGiyimId });
    if (item?.ayakkabiId) eskiParcalar.push({ rol: 'ayakkabı', id: item.ayakkabiId });
    if (item?.cantaId) eskiParcalar.push({ rol: 'çanta', id: item.cantaId });
    if (item?.aksesuarId) eskiParcalar.push({ rol: 'aksesuar', id: item.aksesuarId });

    return eskiParcalar;
  };

  const aiİleKombinUret = async () => {
    if (tumKiyafetler.length < 1) {
      Alert.alert('Eksik', 'Dolabında yeterli kıyafet yok.');
      return;
    }

    if (!kombinAnaliziMumkunMu) {
      Alert.alert(
        'Eksik Ana Parça',
        'Kombin analizi için en az bir üst-alt ikilisi ya da en az bir elbise/tulum eklemelisin.'
      );
      return;
    }

    const yeniRunId = Date.now();

    setAnalizRunId(yeniRunId);
    setAiKombinler([]);
    setAiYukleniyor(true);

    try {
      const sonuc = await yapayZekadanKombinIste(tumKiyafetler, yeniRunId);

      if (Array.isArray(sonuc) && sonuc.length > 0) {
        const ekranIcinSonuc = sonuc.map((item, index) => ({
          ...item,
          _uiKey: `${yeniRunId}-${index}-${item.analizId || 'analiz'}-${Math.random()}`,
        }));

        setAiKombinler(ekranIcinSonuc);

        setTimeout(() => {
          flatListRef.current?.scrollToOffset({
            offset: 0,
            animated: false,
          });
        }, 120);
      } else {
        setAiKombinler([]);
        Alert.alert(
          'Sonuç Yok',
          'Aura şu an kombin üretemedi. En az üst-alt ikilisi ya da elbise/tulum olduğundan emin ol.'
        );
      }
    } catch (error) {
      console.log('Kombin analiz hatası:', error);
      Alert.alert('Hata', 'Kombin analizi sırasında bir sorun oluştu.');
    } finally {
      setAiYukleniyor(false);
    }
  };

  const renderParcaKart = (parca, index) => {
    const imageUrl = resimBul(parca.id);
    const parcaAdi = parcaAdiBul(parca.id);
    const parcaRenk = parcaRenkBul(parca.id);
    const rolEtiket = rolEtiketBul(parca.rol);

    return (
      <View
        key={`${parca.rol}-${parca.id}-${index}`}
        style={styles.parcaKutu}
      >
        {Boolean(imageUrl) ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.kombinImage}
            contentFit="contain"
            cachePolicy="none"
            transition={120}
          />
        ) : (
          <Text style={styles.hataYazi}>{rolEtiket} bulunamadı</Text>
        )}

        <View style={styles.etiket}>
          <Text style={styles.etiketYazi}>{rolEtiket}</Text>
        </View>

        <View style={styles.parcaInfo}>
          <Text style={styles.parcaInfoText}>{parcaAdi}</Text>

          {Boolean(parcaRenk) && (
            <Text style={styles.parcaRenkText}>{parcaRenk}</Text>
          )}
        </View>
      </View>
    );
  };

  const renderKombin = ({ item, index }) => {
    const parcalar = kombinParcalariniHazirla(item);

    return (
      <ScrollView
        contentContainerStyle={styles.kombinSayfasi}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stilBaslikKutusu}>
          <Text style={styles.resultOverline}>ANALİZ #{index + 1}</Text>

          <Text style={styles.stilAdi}>
            {String(item.stilAdi || 'Aura Kombini')}
          </Text>

          <View style={styles.skorRozeti}>
            <Text style={styles.skorYazi}>
              Uyum: %{String(item.uyumOrani || '0.0')}
            </Text>
          </View>

          <Text style={styles.aiAciklama}>
            {String(
              item.aciklama ||
                'Aura bu parçalar arasında güçlü bir uyum yakaladı.'
            )}
          </Text>
        </View>

        <View style={styles.kombinGrid}>
          {parcalar.length > 0 ? (
            parcalar.map((parca, parcaIndex) =>
              renderParcaKart(parca, parcaIndex)
            )
          ) : (
            <View style={styles.bosParcaKutu}>
              <Text style={styles.hataYazi}>Kombin parçaları bulunamadı</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.magicButton}
          onPress={aiİleKombinUret}
          activeOpacity={0.88}
        >
          <Text style={styles.magicButtonText}>Yeni Kombin Analiz Et</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.glowOrb, styles.glowOne]} />
      <View style={[styles.glowOrb, styles.glowTwo]} />
      <View style={[styles.glowOrb, styles.glowThree]} />

      <View style={styles.header}>
        <Text style={styles.overline}>AURA STYLE ENGINE</Text>

        <Text style={styles.title}>Kombin Analizi</Text>

        <Text style={styles.subtitle}>
          Aura artık elbise, dış giyim, ayakkabı, çanta ve aksesuarı birlikte analiz eder.
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{tumKiyafetler.length}</Text>
          <Text style={styles.statLabel}>Parça</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>{anaKiyafetSayisi}</Text>
          <Text style={styles.statLabel}>Kıyafet</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>{ayakkabiParcalar.length}</Text>
          <Text style={styles.statLabel}>Ayakkabı</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>{tamamlayiciSayisi}</Text>
          <Text style={styles.statLabel}>Tamamlayıcı</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Canlı Gardırop Durumu</Text>

        <Text style={styles.infoText}>
          Üst: {ustParcalar.length} · Alt: {altParcalar.length} · Elbise: {elbiseParcalar.length} · Dış: {disGiyimParcalar.length} · Çanta: {cantaParcalar.length} · Aksesuar: {aksesuarParcalar.length}
        </Text>

        <Text style={styles.infoTextMuted}>
          Tahmini kombin potansiyeli: {kombinPotansiyeli}
        </Text>
      </View>

      {yukleniyor ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={COLORS.accentSoft} />
          <Text style={styles.loadingText}>Dolap verileri yükleniyor...</Text>
        </View>
      ) : aiYukleniyor ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={COLORS.accentSoft} />
          <Text style={styles.loadingText}>Aura kombin havuzunu yeniden hesaplıyor...</Text>
        </View>
      ) : aiKombinler.length > 0 ? (
        <FlatList
          key={`kombin-list-${analizRunId}`}
          ref={flatListRef}
          data={aiKombinler}
          horizontal
          pagingEnabled
          extraData={`${analizRunId}-${tumKiyafetler.length}`}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) =>
            item._uiKey || `${analizRunId}-${index}`
          }
          renderItem={renderKombin}
        />
      ) : (
        <View style={styles.centerBox}>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Analiz hazır</Text>

            <Text style={styles.emptyText}>
              Aura, dolabındaki ana parçaları ve tamamlayıcıları birlikte kullanarak kombin oluşturabilir.
            </Text>

            {!kombinAnaliziMumkunMu && (
              <Text style={styles.warningText}>
                En az 1 üst + 1 alt veya 1 elbise/tulum eklemelisin.
              </Text>
            )}

            <TouchableOpacity
              style={[
                styles.magicButton,
                !kombinAnaliziMumkunMu && styles.magicButtonDisabled,
              ]}
              onPress={aiİleKombinUret}
              activeOpacity={0.88}
              disabled={!kombinAnaliziMumkunMu}
            >
              <Text style={styles.magicButtonText}>Analizi Başlat</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 58,
  },

  glowOrb: {
    position: 'absolute',
    borderRadius: 999,
  },

  glowOne: {
    width: 330,
    height: 330,
    top: -140,
    right: -150,
    backgroundColor: COLORS.accentStrong,
    opacity: 0.35,
  },

  glowTwo: {
    width: 300,
    height: 300,
    bottom: 40,
    left: -150,
    backgroundColor: COLORS.pinkGlow,
    opacity: 0.16,
  },

  glowThree: {
    width: 220,
    height: 220,
    top: 260,
    left: -120,
    backgroundColor: COLORS.blueGlow,
    opacity: 0.1,
  },

  header: {
    width: '88%',
    alignSelf: 'center',
    marginBottom: 16,
  },

  overline: {
    color: COLORS.accentSoft,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginBottom: 4,
  },

  title: {
    fontSize: 34,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -1,
  },

  subtitle: {
    color: COLORS.textSoft,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
    marginTop: 6,
  },

  statsRow: {
    width: '88%',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  statCard: {
    width: '23%',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    paddingVertical: 12,
    alignItems: 'center',
  },

  statValue: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '900',
  },

  statLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 3,
  },

  infoCard: {
    width: '88%',
    alignSelf: 'center',
    backgroundColor: COLORS.canvas,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 13,
    marginBottom: 14,
  },

  infoTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 4,
  },

  infoText: {
    color: COLORS.textSoft,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
  },

  infoTextMuted: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
    marginTop: 3,
  },

  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 90,
  },

  loadingText: {
    color: COLORS.accentSoft,
    marginTop: 15,
    fontWeight: '800',
    textAlign: 'center',
  },

  emptyCard: {
    width: '86%',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 28,
    padding: 22,
    alignItems: 'center',
  },

  emptyTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '900',
  },

  emptyText: {
    color: COLORS.textSoft,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 8,
    marginBottom: 12,
  },

  warningText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 12,
  },

  kombinSayfasi: {
    width,
    alignItems: 'center',
    paddingBottom: 120,
  },

  stilBaslikKutusu: {
    width: '86%',
    marginBottom: 18,
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 26,
    padding: 18,
  },

  resultOverline: {
    color: COLORS.accentSoft,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.3,
    marginBottom: 5,
  },

  stilAdi: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.text,
    textAlign: 'center',
  },

  skorRozeti: {
    backgroundColor: COLORS.accentStrong,
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 20,
    marginVertical: 10,
  },

  skorYazi: {
    color: COLORS.white,
    fontWeight: '900',
  },

  aiAciklama: {
    fontSize: 13,
    color: COLORS.textSoft,
    textAlign: 'center',
    lineHeight: 19,
    fontWeight: '600',
  },

  kombinGrid: {
    width: '86%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  parcaKutu: {
    width: '48%',
    height: 205,
    backgroundColor: COLORS.canvas,
    borderRadius: 24,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: 12,
  },

  bosParcaKutu: {
    width: '100%',
    height: 210,
    backgroundColor: COLORS.canvas,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  kombinImage: {
    width: '100%',
    height: '100%',
  },

  etiket: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(167,139,250,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.22)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },

  etiketYazi: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.accentSoft,
  },

  parcaInfo: {
    position: 'absolute',
    bottom: 10,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(7,10,18,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 6,
    paddingHorizontal: 7,
    borderRadius: 12,
  },

  parcaInfoText: {
    color: COLORS.textSoft,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },

  parcaRenkText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 2,
  },

  magicButton: {
    backgroundColor: COLORS.accentStrong,
    paddingVertical: 17,
    borderRadius: 24,
    width: '86%',
    marginTop: 22,
    alignItems: 'center',
    shadowColor: COLORS.accent,
    shadowOpacity: 0.42,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },

  magicButtonDisabled: {
    opacity: 0.45,
  },

  magicButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '900',
  },

  hataYazi: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
});