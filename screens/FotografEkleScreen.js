import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from 'react-native';

import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, storage, auth } from '../firebaseConfig';

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

// Flask sunucun
const PYTHON_API_URL = 'http://192.168.0.8:5000';

// Google Vision API key
// Buraya kendi çalışan eski Vision API key değerini yaz.
const VISION_API_KEY = 'GOOGLE_VISION_API_KEY';

// 1. VERİ SETLERİ
const KATEGORILER = [
  'Üst Giyim',
  'Alt Giyim',
  'Elbise / Tulum',
  'Dış Giyim',
  'Ayakkabı',
  'Çanta',
  'Aksesuar',
];

const ALT_KATEGORILER = {
  'Üst Giyim': [
    'Tişört',
    'Gömlek',
    'Bluz',
    'Crop',
    'Kazak',
    'Sweatshirt',
    'Hırka',
    'Askılı',
    'Body',
  ],

  'Alt Giyim': [
    'Pantolon',
    'Kot Pantolon',
    'Kumaş Pantolon',
    'Etek',
    'Şort',
    'Eşofman',
    'Tayt',
  ],

  'Elbise / Tulum': [
    'Günlük Elbise',
    'Abiye Elbise',
    'Mini Elbise',
    'Midi Elbise',
    'Maxi Elbise',
    'Triko Elbise',
    'Tulum',
  ],

  'Dış Giyim': [
    'Ceket',
    'Blazer',
    'Mont',
    'Kaban',
    'Trençkot',
    'Deri Ceket',
    'Yelek',
  ],

  'Ayakkabı': [
    'Spor Ayakkabı',
    'Sneaker',
    'Bot',
    'Çizme',
    'Topuklu',
    'Babet',
    'Loafer',
    'Sandalet',
    'Terlik',
  ],

  'Çanta': [
    'Omuz Çantası',
    'El Çantası',
    'Sırt Çantası',
    'Clutch',
    'Tote Çanta',
    'Mini Çanta',
  ],

  'Aksesuar': [
    'Şapka',
    'Gözlük',
    'Kemer',
    'Kolye',
    'Küpe',
    'Bileklik',
    'Saat',
    'Fular',
    'Atkı',
  ],
};

const RENKLER = [
  { ad: 'Siyah', hex: '#050505' },
  { ad: 'Beyaz', hex: '#FFFFFF' },
  { ad: 'Kırık Beyaz', hex: '#F8F4EA' },
  { ad: 'Gri', hex: '#9CA3AF' },
  { ad: 'Antrasit', hex: '#374151' },
  { ad: 'Lacivert', hex: '#1E1B4B' },
  { ad: 'Mavi', hex: '#2563EB' },
  { ad: 'Bebe Mavisi', hex: '#93C5FD' },
  { ad: 'Kırmızı', hex: '#DC2626' },
  { ad: 'Bordo', hex: '#7F1D1D' },
  { ad: 'Pembe', hex: '#EC4899' },
  { ad: 'Fuşya', hex: '#C026D3' },
  { ad: 'Mor', hex: '#7C3AED' },
  { ad: 'Lila', hex: '#C4B5FD' },
  { ad: 'Yeşil', hex: '#16A34A' },
  { ad: 'Zümrüt', hex: '#047857' },
  { ad: 'Haki', hex: '#4D7C0F' },
  { ad: 'Bej', hex: '#E7D8BD' },
  { ad: 'Krem', hex: '#FFF7E6' },
  { ad: 'Kahverengi', hex: '#7C2D12' },
  { ad: 'Taba', hex: '#B45309' },
  { ad: 'Turuncu', hex: '#F97316' },
  { ad: 'Sarı', hex: '#FACC15' },
  { ad: 'Gold', hex: '#D4AF37' },
  { ad: 'Gümüş', hex: '#C0C0C0' },
  { ad: 'Jean Mavi', hex: '#3B82F6' },
  { ad: 'Leopar', hex: 'pattern' },
  { ad: 'Desenli', hex: 'pattern' },
  { ad: 'Çok Renkli', hex: 'linear-gradient' },
];

const kategoriTypeBul = (kategori) => {
  if (kategori === 'Üst Giyim') return 'top';
  if (kategori === 'Alt Giyim') return 'bottom';
  if (kategori === 'Elbise / Tulum') return 'dress';
  if (kategori === 'Dış Giyim') return 'outerwear';
  if (kategori === 'Ayakkabı') return 'shoes';
  if (kategori === 'Çanta') return 'bag';
  if (kategori === 'Aksesuar') return 'accessory';
  return 'other';
};

const kategoriRolBul = (kategori) => {
  if (kategori === 'Üst Giyim') return 'üst';
  if (kategori === 'Alt Giyim') return 'alt';
  if (kategori === 'Elbise / Tulum') return 'elbise';
  if (kategori === 'Dış Giyim') return 'dış giyim';
  if (kategori === 'Ayakkabı') return 'ayakkabı';
  if (kategori === 'Çanta') return 'çanta';
  if (kategori === 'Aksesuar') return 'aksesuar';
  return 'diğer';
};

const renkGorseliOzelMi = (hex) => {
  return hex === 'linear-gradient' || hex === 'pattern';
};

export default function FotografEkleScreen() {
  const [imageUri, setImageUri] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [islemDurumu, setIslemDurumu] = useState('');

  const [seciliKategori, setSeciliKategori] = useState('Üst Giyim');
  const [seciliAltKategori, setSeciliAltKategori] = useState(
    ALT_KATEGORILER['Üst Giyim'][0]
  );
  const [seciliRenk, setSeciliRenk] = useState('Siyah');

  useEffect(() => {
    setSeciliAltKategori(ALT_KATEGORILER[seciliKategori][0]);
  }, [seciliKategori]);

  const kameradanCek = async () => {
  const izin = await ImagePicker.requestCameraPermissionsAsync();

  if (!izin.granted) {
    Alert.alert("İzin Gerekli", "Kamera izni vermelisin.");
    return;
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.8,
  });

  if (!result.canceled) {
    setImageUri(result.assets[0].uri);
  }
};

const galeridenSec = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.8,
  });

  if (!result.canceled) {
    setImageUri(result.assets[0].uri);
  }
};
  const uriToBlob = async (uri) => {
    const response = await fetch(uri);
    return await response.blob();
  };

  const arkaPlaniSilVeDondur = async (uri) => {
    setIslemDurumu('Aura arka plan silme motoru çalışıyor...');

    try {
      const formData = new FormData();

      formData.append('image_file', {
        uri,
        type: 'image/jpeg',
        name: 'kiyafet.jpg',
      });

      const response = await fetch(`${PYTHON_API_URL}/api/arka-plan-sil`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const hata = await response.text();
        console.log('rembg API hatası:', response.status, hata);

        setIslemDurumu(
          'Arka plan silme atlandı. Orijinal fotoğraf kaydediliyor...'
        );

        return await uriToBlob(uri);
      }

      return await response.blob();
    } catch (error) {
      console.log('rembg bağlantı hatası:', error);

      setIslemDurumu(
        'Arka plan silme atlandı. Orijinal fotoğraf kaydediliyor...'
      );

      return await uriToBlob(uri);
    }
  };

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        const result = reader.result;

        if (!result || typeof result !== 'string') {
          reject(new Error('Base64 dönüşümü başarısız oldu.'));
          return;
        }

        resolve(result.split(',')[1]);
      };

      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const visionAnaliziYap = async (base64Image) => {
    if (!base64Image) {
      console.log('Vision API atlandı: base64 veri yok.');
      return null;
    }

    if (!VISION_API_KEY || VISION_API_KEY === 'BURAYA_KENDI_VISION_API_KEYINI_YAZ') {
      console.log('Vision API atlandı: API key girilmemiş.');
      return null;
    }

    const url = `https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`;

    const body = {
      requests: [
        {
          image: { content: base64Image },
          features: [
            { type: 'LABEL_DETECTION', maxResults: 10 },
            { type: 'IMAGE_PROPERTIES', maxResults: 1 },
          ],
        },
      ],
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const text = await response.text();

      let data = null;

      try {
        data = JSON.parse(text);
      } catch (jsonError) {
        console.log('Vision API JSON olmayan cevap döndü:', text);
        return null;
      }

      if (!response.ok) {
        console.log('Vision API HTTP hatası:', response.status, data);
        return null;
      }

      if (!data || !Array.isArray(data.responses) || !data.responses[0]) {
        console.log('Vision API boş cevap döndü:', data);
        return null;
      }

      if (data.responses[0].error) {
        console.log('Vision API servis hatası:', data.responses[0].error);
        return null;
      }

      return data.responses[0];
    } catch (error) {
      console.log('Vision API bağlantı/işleme hatası:', error);
      return null;
    }
  };

  const hexRenkOlustur = (aiRenk) => {
    if (
      aiRenk &&
      typeof aiRenk.red === 'number' &&
      typeof aiRenk.green === 'number' &&
      typeof aiRenk.blue === 'number'
    ) {
      return `#${(
        (1 << 24) +
        (aiRenk.red << 16) +
        (aiRenk.green << 8) +
        aiRenk.blue
      )
        .toString(16)
        .slice(1)}`;
    }

    return '';
  };

  const yapayZekaIleKaydet = async () => {
    if (!imageUri) {
      Alert.alert('Eksik Adım', 'Lütfen bir fotoğraf seç.');
      return;
    }

    const aktifKullanici = auth.currentUser;

    if (!aktifKullanici) {
      Alert.alert('Oturum Hatası', 'Lütfen tekrar giriş yap.');
      return;
    }

    setYukleniyor(true);

    try {
      const kategoriType = kategoriTypeBul(seciliKategori);
      const kategoriRol = kategoriRolBul(seciliKategori);

      // 1. Kendi rembg motorumuzla arka plan silme
      const islenmisBlob = await arkaPlaniSilVeDondur(imageUri);

      // 2. Vision API için Base64'e Çevirme
      setIslemDurumu('Görsel zeka analiz ediyor...');

      const base64Data = await blobToBase64(islenmisBlob);

      // 3. Google Vision Analizi
      const analiz = await visionAnaliziYap(base64Data);

      const aiEtiket = analiz?.labelAnnotations?.[0]?.description || '';
      const aiRenk =
        analiz?.imagePropertiesAnnotation?.dominantColors?.colors?.[0]?.color;

      const hexRenk = hexRenkOlustur(aiRenk);

      // 4. Firebase Storage'a Yükleme
      setIslemDurumu('Dolaba asılıyor...');

      const dosyaAdi = `kiyafetler/${aktifKullanici.uid}/${Date.now()}_temiz.png`;
      const storageRef = ref(storage, dosyaAdi);

      const snapshot = await uploadBytes(storageRef, islenmisBlob);
      const indirmeLinki = await getDownloadURL(snapshot.ref);

      // 5. STİL İKİZİ İÇİN PYTHON'A İSTEK
      setIslemDurumu('Stil İkizi vektörleri hesaplanıyor...');

      let uretilenVektor = [];

      try {
        const pythonApiUrl = `${PYTHON_API_URL}/vektor-cikar`;

        const vektorCevap = await fetch(pythonApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: indirmeLinki }),
        });

        const vektorData = await vektorCevap.json();

        if (vektorData.success) {
          uretilenVektor = vektorData.embedding;
        }
      } catch (err) {
        console.error('Vektör çıkarılamadı:', err);
      }

      // 6. VERİTABANI KAYDI
      await addDoc(collection(db, 'gardirop'), {
        userId: aktifKullanici.uid,

        imageUrl: indirmeLinki,

        kategori: seciliKategori,
        anaKategori: seciliKategori,
        altKategori: seciliAltKategori,
        renk: seciliRenk,

        type: kategoriType,
        rol: kategoriRol,

        embedding: uretilenVektor,

        etiketler: {
          altTur: aiEtiket || seciliAltKategori,
          secilenAltTur: seciliAltKategori,
          renk: seciliRenk,
          aiRenkAnalizi: hexRenk,
          visionTumEtiketler:
            analiz?.labelAnnotations?.map((l) => l.description) || [],
          materyal: '',
          desen:
            seciliRenk === 'Desenli' ||
            seciliRenk === 'Leopar' ||
            seciliRenk === 'Çok Renkli'
              ? seciliRenk
              : '',
        },

        eklenmeTarihi: serverTimestamp(),
        aktifMi: true,
      });

      Alert.alert(
        'Başarılı!',
        'Aura kıyafetini analiz etti ve dolabına ekledi. ✨'
      );

      setImageUri(null);
    } catch (error) {
      Alert.alert('Hata', error.message);
    } finally {
      setYukleniyor(false);
      setIslemDurumu('');
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.glowOrb, styles.glowOne]} />
      <View style={[styles.glowOrb, styles.glowTwo]} />
      <View style={[styles.glowOrb, styles.glowThree]} />

      <View style={styles.header}>
        <Text style={styles.overline}>AI WARDROBE INTAKE</Text>

        <Text style={styles.title}>Yeni Parça Ekle</Text>

        <Text style={styles.subtitle}>
          Fotoğrafını seç, Aura kendi arka plan silme motoruyla temizlesin ve AI ile dolabına kaydetsin.
        </Text>
      </View>

      <View style={styles.aiInfoCard}>
        <View style={styles.aiIconBox}>
          <Feather name="cpu" size={19} color={COLORS.accentSoft} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.aiInfoTitle}>Yerel AI motoru aktif</Text>

          <Text style={styles.aiInfoText}>
            Arka plan silme, görsel tanıma, renk analizi ve stil vektörü otomatik hesaplanır.
          </Text>
        </View>
      </View>

      <View style={styles.imageGlassContainer}>
        <View style={styles.imageGlowPurple} />
        <View style={styles.imageGlowBlue} />

        {imageUri ? (
          <Image
  source={{ uri: imageUri }}
  style={styles.previewImage}
  resizeMode="contain"
/>
        ) : (
          <View style={styles.placeholderContainer}>
            <View style={styles.placeholderIconRing}>
              <Feather name="image" size={42} color={COLORS.accentSoft} />
            </View>

            <Text style={styles.placeholderTitle}>Fotoğraf Alanı</Text>

            <Text style={styles.placeholderText}>
              Kamera ile çek veya galeriden bir parça seç.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.86}
          onPress={kameradanCek}
        >
          <View style={styles.actionBtnIcon}>
            <Feather name="camera" size={19} color={COLORS.accentSoft} />
          </View>

          <Text style={styles.actionBtnText}>Kamera</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.86}
          onPress={galeridenSec}
        >
          <View style={styles.actionBtnIcon}>
            <Feather name="image" size={19} color={COLORS.accentSoft} />
          </View>

          <Text style={styles.actionBtnText}>Galeri</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.selectionSection}>
        <Text style={styles.sectionOverline}>CATEGORY</Text>
        <Text style={styles.sectionTitle}>Kategori</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillScroll}
        >
          {KATEGORILER.map((kat) => (
            <TouchableOpacity
              key={kat}
              onPress={() => setSeciliKategori(kat)}
              activeOpacity={0.86}
              style={[
                styles.pill,
                seciliKategori === kat && styles.pillActive,
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  seciliKategori === kat && styles.pillTextActive,
                ]}
              >
                {kat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.selectionSection}>
        <Text style={styles.sectionOverline}>TYPE</Text>
        <Text style={styles.sectionTitle}>Tür</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillScroll}
        >
          {ALT_KATEGORILER[seciliKategori].map((altKat) => (
            <TouchableOpacity
              key={altKat}
              onPress={() => setSeciliAltKategori(altKat)}
              activeOpacity={0.86}
              style={[
                styles.pill,
                seciliAltKategori === altKat && styles.pillActive,
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  seciliAltKategori === altKat && styles.pillTextActive,
                ]}
              >
                {altKat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.selectionSection}>
        <Text style={styles.sectionOverline}>COLOR PROFILE</Text>
        <Text style={styles.sectionTitle}>Renk</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.colorScroll}
        >
          {RENKLER.map((renk) => {
            const ozelRenk = renkGorseliOzelMi(renk.hex);

            return (
              <TouchableOpacity
                key={renk.ad}
                onPress={() => setSeciliRenk(renk.ad)}
                activeOpacity={0.86}
                style={[
                  styles.colorPill,
                  seciliRenk === renk.ad && styles.colorPillActive,
                ]}
              >
                {ozelRenk ? (
                  <View style={styles.multiColorDot}>
                    <View
                      style={[
                        styles.multiPart,
                        { backgroundColor: COLORS.accentStrong },
                      ]}
                    />
                    <View
                      style={[
                        styles.multiPart,
                        { backgroundColor: COLORS.pinkGlow },
                      ]}
                    />
                    <View
                      style={[
                        styles.multiPart,
                        { backgroundColor: COLORS.blueGlow },
                      ]}
                    />
                  </View>
                ) : (
                  <View
                    style={[
                      styles.colorDot,
                      {
                        backgroundColor: renk.hex,
                        borderColor:
                          renk.ad === 'Beyaz' || renk.ad === 'Krem'
                            ? 'rgba(255,255,255,0.65)'
                            : 'rgba(255,255,255,0.22)',
                      },
                    ]}
                  />
                )}

                <Text
                  style={[
                    styles.pillText,
                    seciliRenk === renk.ad && styles.pillTextActive,
                    { marginLeft: 7 },
                  ]}
                >
                  {renk.ad}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.submitSection}>
        {yukleniyor ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={COLORS.accentSoft} />

            <Text style={styles.statusText}>
              {islemDurumu || 'İşlem hazırlanıyor...'}
            </Text>

            <Text style={styles.statusSubText}>
              Aura parça profilini oluşturuyor.
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.submitBtn}
            activeOpacity={0.9}
            onPress={yapayZekaIleKaydet}
          >
            <Feather
              name="cpu"
              size={22}
              color={COLORS.white}
              style={{ marginRight: 8 }}
            />

            <Text style={styles.submitBtnText}>Aura Analiz Et & Kaydet</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 115,
  },

  glowOrb: {
    position: 'absolute',
    borderRadius: 999,
  },

  glowOne: {
    width: 360,
    height: 360,
    top: -150,
    left: -130,
    backgroundColor: COLORS.accentStrong,
    opacity: 0.4,
  },

  glowTwo: {
    width: 330,
    height: 330,
    bottom: 100,
    right: -150,
    backgroundColor: COLORS.pinkGlow,
    opacity: 0.22,
  },

  glowThree: {
    width: 260,
    height: 260,
    top: height * 0.42,
    left: -140,
    backgroundColor: COLORS.blueGlow,
    opacity: 0.12,
  },

  header: {
    width: width * 0.86,
    marginBottom: 16,
  },

  overline: {
    fontSize: 12,
    color: COLORS.accentSoft,
    fontWeight: '900',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 4,
  },

  title: {
    fontSize: 36,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -1.1,
  },

  subtitle: {
    fontSize: 14,
    color: COLORS.textSoft,
    marginTop: 7,
    lineHeight: 20,
    fontWeight: '600',
  },

  aiInfoCard: {
    width: width * 0.86,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 26,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    shadowColor: COLORS.accentStrong,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },

  aiIconBox: {
    width: 45,
    height: 45,
    borderRadius: 17,
    backgroundColor: 'rgba(167,139,250,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  aiInfoTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '900',
  },

  aiInfoText: {
    color: COLORS.textSoft,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
    marginTop: 3,
  },

  imageGlassContainer: {
    width: width * 0.82,
    height: width * 0.82,
    backgroundColor: COLORS.canvas,
    borderRadius: 36,
    borderWidth: 1.2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: COLORS.accentStrong,
    shadowOpacity: 0.28,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 12 },
    elevation: 9,
  },

  imageGlowPurple: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: COLORS.accentStrong,
    opacity: 0.16,
    top: 56,
    left: 62,
  },

  imageGlowBlue: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: COLORS.blueGlow,
    opacity: 0.1,
    bottom: 38,
    right: -30,
  },

  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },

  placeholderContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },

  placeholderIconRing: {
    width: 90,
    height: 90,
    borderRadius: 34,
    backgroundColor: 'rgba(167,139,250,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },

  placeholderTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '900',
  },

  placeholderText: {
    color: COLORS.textSoft,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 7,
    lineHeight: 19,
    textAlign: 'center',
  },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: width * 0.82,
    marginTop: 16,
  },

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    width: '48%',
    paddingVertical: 13,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  actionBtnIcon: {
    width: 30,
    height: 30,
    borderRadius: 12,
    backgroundColor: 'rgba(167,139,250,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  actionBtnText: {
    color: COLORS.text,
    fontWeight: '900',
    marginLeft: 9,
  },

  selectionSection: {
    width: width * 0.86,
    marginTop: 25,
  },

  sectionOverline: {
    fontSize: 10,
    color: COLORS.accentSoft,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginLeft: 5,
    marginBottom: 3,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 11,
    marginLeft: 5,
  },

  pillScroll: {
    paddingRight: 20,
    gap: 10,
  },

  pill: {
    paddingVertical: 10,
    paddingHorizontal: 17,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  pillActive: {
    backgroundColor: COLORS.accentStrong,
    borderColor: COLORS.accentSoft,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.34,
    shadowRadius: 13,
    shadowOffset: { width: 0, height: 7 },
    elevation: 7,
  },

  pillText: {
    color: COLORS.textSoft,
    fontWeight: '800',
    fontSize: 13,
  },

  pillTextActive: {
    color: COLORS.white,
    fontWeight: '900',
  },

  colorScroll: {
    paddingRight: 20,
    gap: 12,
  },

  colorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  colorPillActive: {
    backgroundColor: COLORS.accentStrong,
    borderColor: COLORS.accentSoft,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.32,
    shadowRadius: 13,
    shadowOffset: { width: 0, height: 7 },
    elevation: 7,
  },

  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.2,
  },

  multiColorDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },

  multiPart: {
    flex: 1,
    height: '100%',
  },

  submitSection: {
    width: width * 0.86,
    marginTop: 36,
  },

  submitBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.accentStrong,
    paddingVertical: 17,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.accent,
    shadowOpacity: 0.46,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 9 },
    elevation: 9,
  },

  submitBtnText: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 0.2,
  },

  loadingCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 26,
    paddingVertical: 24,
    paddingHorizontal: 18,
    alignItems: 'center',
  },

  statusText: {
    color: COLORS.accentSoft,
    marginTop: 13,
    fontWeight: '900',
    textAlign: 'center',
  },

  statusSubText: {
    color: COLORS.textSoft,
    marginTop: 5,
    fontWeight: '600',
    fontSize: 12,
    textAlign: 'center',
  },
});