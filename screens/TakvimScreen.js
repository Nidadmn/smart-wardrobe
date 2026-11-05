import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';

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

  gold: '#FFD76A',
  danger: '#FB7185',
  white: '#FFFFFF',
};

// DİNAMİK TARİH HESAPLAMA (YYYY-MM-DD formatı)
const getGelecekGunler = () => {
  const gunIsimleri = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
  const aylar = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  const gunler = [];
  const bugun = new Date();
  
  for (let i = -7; i <= 7; i++) {
    const gelecekGun = new Date(bugun);
    gelecekGun.setDate(bugun.getDate() + i);
    
    const yil = gelecekGun.getFullYear();
    const ayFormat = String(gelecekGun.getMonth() + 1).padStart(2, '0');
    const gunFormat = String(gelecekGun.getDate()).padStart(2, '0');

    gunler.push({
      gun: gunIsimleri[gelecekGun.getDay()],
      tarih: gelecekGun.getDate().toString(),
      ay: aylar[gelecekGun.getMonth()],
      tamTarih: `${yil}-${ayFormat}-${gunFormat}`,
      isToday: i === 0,
    });
  }
  return gunler;
};

const GUNLER = getGelecekGunler();
const BUGUN_OBJESI = GUNLER.find(g => g.isToday) || GUNLER[7];

export default function TakvimScreen() {
  const navigation = useNavigation(); 
  
  const scrollViewRef = React.useRef(null);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ x: 350, animated: true });
    }, 500);
  }, []);

  const [seciliGunObjesi, setSeciliGunObjesi] = useState(BUGUN_OBJESI);
  const [havaVerileri, setHavaVerileri] = useState({});
  const [havaYukleniyor, setHavaYukleniyor] = useState(true);
  const [sehirIsmi, setSehirIsmi] = useState(''); 
  
  const [planlanmisKombin, setPlanlanmisKombin] = useState(null);
  const [kombinYukleniyor, setKombinYukleniyor] = useState(false);

  // 1. HAVA DURUMU API ENTEGRASYONU
  useEffect(() => {
    const havaDurumunuGetir = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setHavaYukleniyor(false);
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        const lat = location.coords.latitude;
        const lon = location.coords.longitude;
        const API_KEY = "process.env.EXPO_PUBLIC_WEATHER_API_KEY";

        const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=tr&appid=${API_KEY}`);
        const data = await response.json();

        if (response.ok) {
          setSehirIsmi(data.city.name); 

          const gunlukHava = {};
          data.list.forEach(item => {
            const dateObj = new Date(item.dt_txt);
            const gunString = dateObj.getDate().toString();
            
            if (!gunlukHava[gunString] || item.dt_txt.includes("12:00:00")) {
              const derece = Math.round(item.main.temp);
              const condition = item.weather[0].main.toLowerCase();
              
              let kategori = '';
              let tavsiye = '';
              let weatherIcon = 'cloud';
              let iconColor = COLORS.accentSoft;

              if (derece < 10) {
                kategori = 'Soğuk';
                tavsiye = "Katmanlı giyinme vakti! Kalın bir kazak, yünlü kaban ve atkı/bere gibi aksesuarları tuvale sürükle.";
                weatherIcon = condition.includes('snow') ? 'cloud-snow' : 'thermometer';
                iconColor = '#7DD3FC'; 
              } else if (derece >= 10 && derece < 18) {
                kategori = 'Serin';
                tavsiye = "Trençkot veya deri ceket havası. İçine ince bir triko veya gömlek ekleyerek şık bir geçiş kombini yapabilirsin.";
                weatherIcon = condition.includes('rain') ? 'cloud-rain' : 'wind';
                iconColor = '#B9B4C8'; 
              } else if (derece >= 18 && derece < 25) {
                kategori = 'Ilık';
                tavsiye = "Harika bir hava! Hafif kumaşlar, tişörtler, ince ceketler veya elbiselerle rahat bir stil oluştur.";
                weatherIcon = condition.includes('rain') ? 'cloud-drizzle' : 'sun';
                iconColor = COLORS.gold; 
              } else {
                kategori = 'Sıcak';
                tavsiye = "Güneş parlıyor! Keten kumaşlar, şortlar ve açık renkli nefes alan parçalar tercih etmeyi unutma.";
                weatherIcon = 'sun';
                iconColor = COLORS.danger; 
              }

              gunlukHava[gunString] = { derece, ikon: weatherIcon, renk: iconColor, tavsiye, kategori };
            }
          });
          
          setHavaVerileri(gunlukHava);
        }
      } catch (error) {
        console.log("Hava durumu çekilemedi: ", error);
      } finally {
        setHavaYukleniyor(false);
      }
    };

    havaDurumunuGetir();
  }, []);

  // 2. SEÇİLEN TARİHE AİT KOMBİNİ ÇEKME
  useFocusEffect(
    useCallback(() => {
      const dinamikKombinGetir = async () => {
        setKombinYukleniyor(true);
        try {
          const docRef = doc(db, "kombin_planlayici", `${seciliGunObjesi.tamTarih}_kombin`);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            setPlanlanmisKombin(docSnap.data());
          } else {
            setPlanlanmisKombin(null); 
          }
        } catch (e) {
          console.log("Kombin verisi çekilirken hata oluştu:", e);
        } finally {
          setKombinYukleniyor(false);
        }
      };

      dinamikKombinGetir();
    }, [seciliGunObjesi.tamTarih])
  );

  // 3. KOMBİNİ PUANLAMA
  const kombinPuanla = async (yeniPuan) => {
    if (!planlanmisKombin) return;

    try {
      const docRef = doc(db, "kombin_planlayici", `${seciliGunObjesi.tamTarih}_kombin`);
      await setDoc(docRef, { puan: yeniPuan }, { merge: true });
      setPlanlanmisKombin({ ...planlanmisKombin, puan: yeniPuan }); 
    } catch (e) {
      console.log("Puan güncellenirken hata oluştu:", e);
    }
  };

  const seciliHava = havaVerileri[seciliGunObjesi.tarih];

  return (
    <View style={styles.container}>
      <View style={[styles.glowOrb, styles.glowOne]} />
      <View style={[styles.glowOrb, styles.glowTwo]} />
      <View style={[styles.glowOrb, styles.glowThree]} />

      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.overline}>STYLE PLANNER</Text>
            <Text style={styles.pageTitle}>Planlayıcı</Text>
          </View>

          {sehirIsmi ? (
            <View style={styles.locationBadge}>
              <Feather name="map-pin" size={14} color={COLORS.accentSoft} />
              <Text style={styles.locationText}>{sehirIsmi}</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.subtitle}>Günlük stilini hava durumuna göre önceden tasarla.</Text>
      </View>

      <View style={styles.calendarStrip}>
        <ScrollView
          horizontal
          ref={scrollViewRef}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.calendarContent}
        >
          {GUNLER.map((item, index) => {
            const isActive = seciliGunObjesi.tarih === item.tarih;

            return (
              <TouchableOpacity
                key={index}
                onPress={() => setSeciliGunObjesi(item)}
                style={styles.dayContainer}
                activeOpacity={0.85}
              >
                <Text style={[styles.dayText, isActive && styles.dayTextActive]}>
                  {item.gun}
                </Text>

                <View
                  style={[
                    styles.dateCircle,
                    isActive && styles.dateCircleActive,
                    item.isToday && !isActive && styles.todayCircle,
                  ]}
                >
                  <Text style={[styles.dateText, isActive && styles.dateTextActive]}>
                    {item.tarih}
                  </Text>
                </View>

                {isActive && <View style={styles.activeDot} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.outfitContainer}>
        <View style={styles.glassCard}>
          <View style={styles.cardGlowPurple} />
          <View style={styles.cardGlowBlue} />

          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardOverline}>SELECTED DAY</Text>
              <Text style={styles.cardTitle}>
                {seciliGunObjesi.tarih} {seciliGunObjesi.ay}
              </Text>
            </View>

            {havaYukleniyor ? (
              <ActivityIndicator size="small" color={COLORS.accentSoft} />
            ) : seciliHava ? (
              <View style={[styles.weatherBadge, { borderColor: seciliHava.renk }]}>
                <Text style={[styles.weatherBadgeText, { color: seciliHava.renk }]}>
                  {seciliHava.derece}°C
                </Text>
                <Feather
                  name={seciliHava.ikon}
                  size={18}
                  color={seciliHava.renk}
                  style={{ marginLeft: 6 }}
                />
              </View>
            ) : (
              <View style={styles.weatherBadge}>
                <Text style={styles.weatherBadgeText}>--</Text>
                <Feather
                  name="cloud-off"
                  size={18}
                  color={COLORS.textMuted}
                  style={{ marginLeft: 6 }}
                />
              </View>
            )}
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {seciliHava && (
              <View style={styles.tipContainer}>
                <View style={styles.tipHeader}>
                  <View style={styles.tipIconBox}>
                    <Feather name="zap" size={16} color={COLORS.accentSoft} />
                  </View>

                  <View>
                    <Text style={styles.tipTitle}>Stil Asistanı Öneriyor</Text>
                    <Text style={styles.tipCategoryText}>Hava Durumu: {seciliHava.kategori}</Text>
                  </View>
                </View>

                <Text style={styles.tipText}>{seciliHava.tavsiye}</Text>
              </View>
            )}

            <View style={styles.outfitDisplay}>
              {kombinYukleniyor ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="large" color={COLORS.accentSoft} />
                  <Text style={styles.loadingText}>Planlanan kombin kontrol ediliyor...</Text>
                </View>
              ) : planlanmisKombin ? (
                <View style={styles.plannedContent}>
                  <Text style={styles.sectionOverline}>OUTFIT READY</Text>
                  <Text style={styles.plannedTitle}>Planlanan Parçalar</Text>
                  
                  <View style={styles.itemsGrid}>
                    {planlanmisKombin.kombinParcalari?.map((item, index) => (
                      <View key={index} style={styles.itemMiniCard}>
                        <View style={styles.miniGlow} />

                        {item.imageUrl ? (
                          <Image
                            source={{ uri: item.imageUrl }}
                            style={styles.miniCardImg}
                            contentFit="contain"
                          />
                        ) : (
                          <Feather name="check-circle" size={24} color={COLORS.accentSoft} />
                        )}
                      </View>
                    ))}
                  </View>
                  
                  <View style={styles.divider} />
                  
                  <Text style={styles.ratingTitle}>Kombin Başarısı</Text>

                  <View style={styles.starRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity key={star} onPress={() => kombinPuanla(star)}>
                        <FontAwesome
                          name={star <= (planlanmisKombin.puan || 0) ? "star" : "star-o"}
                          size={32}
                          color={COLORS.gold}
                          style={{ marginHorizontal: 6 }}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                  
                  <TouchableOpacity
                    style={styles.replanButton}
                    onPress={() => navigation.navigate('Tuval', { planlanacakTarih: seciliGunObjesi.tamTarih })}
                  >
                    <Feather name="refresh-ccw" size={14} color={COLORS.accentSoft} />
                    <Text style={styles.replanText}>Kombini Yeniden Planla</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.emptyPlan}>
                  <View style={styles.emptyIconRing}>
                    <Feather name="calendar" size={30} color={COLORS.accentSoft} />
                  </View>

                  <Text style={styles.emptyStateTitle}>Bu gün henüz boş</Text>
                  <Text style={styles.emptyStateText}>
                    Bu tarih için bir kombin planlamadın. Tuval’de hızlıca tasarla.
                  </Text>
                  
                  <TouchableOpacity
                    style={styles.addBtn}
                    activeOpacity={0.88}
                    onPress={() => navigation.navigate('Tuval', { planlanacakTarih: seciliGunObjesi.tamTarih })}
                  >
                    <Feather name="edit-3" size={18} color={COLORS.white} style={{ marginRight: 8 }} />
                    <Text style={styles.addBtnText}>Tuval'de Tasarla</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 60,
  },

  glowOrb: {
    position: 'absolute',
    borderRadius: 999,
  },

  glowOne: {
    top: -150,
    right: -130,
    width: 380,
    height: 380,
    backgroundColor: COLORS.accentStrong,
    opacity: 0.42,
  },

  glowTwo: {
    bottom: -130,
    left: -150,
    width: 340,
    height: 340,
    backgroundColor: COLORS.pinkGlow,
    opacity: 0.24,
  },

  glowThree: {
    top: height * 0.38,
    left: -140,
    width: 260,
    height: 260,
    backgroundColor: COLORS.blueGlow,
    opacity: 0.13,
  },

  header: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },

  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  overline: {
    fontSize: 12,
    color: COLORS.accentSoft,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  pageTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -1.1,
    marginTop: 4,
  },

  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardStrong,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  locationText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.accentSoft,
  },

  subtitle: {
    fontSize: 14,
    color: COLORS.textSoft,
    marginTop: 8,
    fontWeight: '600',
    lineHeight: 20,
  },

  calendarStrip: {
    marginBottom: 28,
    height: 96,
  },

  calendarContent: {
    paddingHorizontal: 20,
  },

  dayContainer: {
    alignItems: 'center',
    marginRight: 18,
    width: 52,
  },

  dayText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 10,
    fontWeight: '800',
  },

  dayTextActive: {
    color: COLORS.accentSoft,
  },

  dateCircle: {
    width: 52,
    height: 52,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  dateCircleActive: {
    backgroundColor: COLORS.accentStrong,
    borderColor: COLORS.accentSoft,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.42,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },

  todayCircle: {
    borderColor: COLORS.accentSoft,
    borderWidth: 1.5,
  },

  dateText: {
    fontSize: 18,
    color: COLORS.textSoft,
    fontWeight: '900',
  },

  dateTextActive: {
    color: COLORS.white,
  },

  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accentSoft,
    marginTop: 8,
  },

  outfitContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 110,
  },

  glassCard: {
    width: '100%',
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 36,
    borderWidth: 1.2,
    borderColor: COLORS.border,
    padding: 24,
    overflow: 'hidden',
    shadowColor: COLORS.accentStrong,
    shadowOpacity: 0.24,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 12 },
    elevation: 9,
  },

  cardGlowPurple: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: COLORS.accentStrong,
    opacity: 0.15,
    top: 40,
    right: -60,
  },

  cardGlowBlue: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: COLORS.blueGlow,
    opacity: 0.08,
    bottom: 70,
    left: -70,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    zIndex: 2,
  },

  cardOverline: {
    fontSize: 10,
    color: COLORS.accentSoft,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 3,
  },

  cardTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: COLORS.text,
  },

  weatherBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardStrong,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 17,
    borderWidth: 1.4,
  },

  weatherBadgeText: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.textSoft,
  },

  tipContainer: {
    width: '100%',
    backgroundColor: COLORS.cardStrong,
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },

  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  tipIconBox: {
    width: 38,
    height: 38,
    borderRadius: 15,
    backgroundColor: 'rgba(167,139,250,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  tipTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.text,
  },

  tipCategoryText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.accentSoft,
    marginTop: 2,
  },

  tipText: {
    color: COLORS.textSoft,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '600',
  },

  outfitDisplay: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    marginTop: 2,
  },

  loadingBox: {
    paddingVertical: 34,
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 14,
    color: COLORS.textSoft,
    fontWeight: '700',
    textAlign: 'center',
  },

  plannedContent: {
    width: '100%',
    alignItems: 'center',
  },

  sectionOverline: {
    fontSize: 11,
    color: COLORS.accentSoft,
    fontWeight: '900',
    letterSpacing: 1.3,
  },

  plannedTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 5,
    marginBottom: 16,
  },

  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 15,
  },

  itemMiniCard: {
    width: 76,
    height: 76,
    backgroundColor: COLORS.cardStrong,
    borderRadius: 22,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 7,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  miniGlow: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.accentStrong,
    opacity: 0.16,
  },

  miniCardImg: {
    width: '92%',
    height: '92%',
    zIndex: 2,
  },

  divider: {
    height: 1,
    width: '88%',
    backgroundColor: COLORS.border,
    marginVertical: 18,
  },

  ratingTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 12,
  },

  starRow: {
    flexDirection: 'row',
  },

  replanButton: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(167,139,250,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.22)',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 17,
  },

  replanText: {
    color: COLORS.accentSoft,
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 7,
  },

  emptyPlan: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 18,
  },

  emptyIconRing: {
    width: 78,
    height: 78,
    borderRadius: 30,
    backgroundColor: 'rgba(167,139,250,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },

  emptyStateTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8,
  },

  emptyStateText: {
    color: COLORS.textSoft,
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 18,
  },

  addBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.accentStrong,
    borderRadius: 20,
    paddingHorizontal: 25,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.accent,
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },

  addBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '900',
  },
});